import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';

import {
  Button, Form, Select, Radio, Tooltip, Space, Alert
} from 'antd';

import { InfoCircleOutlined } from '@ant-design/icons';

import PropTypes from 'prop-types';
import { loadCellSets } from 'redux/actions/cellSets';
import { setComparisonGroup, setComparisonType } from 'redux/actions/differentialExpression';
import { getCellSets } from 'redux/selectors';
import { composeTree } from 'utils/cellSets';
import checkCanRunDiffExpr from 'utils/differentialExpression/checkCanRunDiffExpr';

const { Option, OptGroup } = Select;

const ComparisonType = Object.freeze({ BETWEEN: 'between', WITHIN: 'within' });
const getCellSetKey = (name) => (name?.split('/')[1] || name);
const getRootKey = (name) => name?.split('/')[0];

const canRunDiffExprResults = {
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  INSUFFICIENT_CELLS_WARNING: 'INSUFFICIENT_CELLS_WARNING',
  INSUFFCIENT_CELLS_ERROR: 'INSUFFCIENT_CELLS_ERROR'
}

const DiffExprCompute = (props) => {
  const {
    experimentId, onCompute,
  } = props;

  const dispatch = useDispatch();
  const { properties, hierarchy } = useSelector(getCellSets());
  const [isFormValid, setIsFormValid] = useState(false);
  const [numSamples, setNumSamples] = useState(1);
  const [sampleKeys, setSampleKeys] = useState([])
  const comparisonGroup = useSelector((state) => state.differentialExpression.comparison.group);
  const selectedComparison = useSelector((state) => state.differentialExpression.comparison.type);
  const { basis, cellSet, compareWith } = comparisonGroup?.[selectedComparison] || {};

  /**
   * Loads cell set on initial render if it does not already exist in the store.
   */
  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (hierarchy && hierarchy.length === 0) return;

    // If any selected option is deleted, set the option to null
    Object.keys(comparisonGroup).forEach((type) => {
      const deleteKeys = {};

      Object.entries(comparisonGroup[type]).forEach(([comparisonKey, selectedCell]) => {
        selectedCell = getCellSetKey(selectedCell)
        if (selectedCell && !properties.hasOwnProperty(selectedCell)) deleteKeys[comparisonKey] = null
      });

      if (Object.keys(deleteKeys).length) {

        dispatch(
          setComparisonGroup({
            type,
            ...comparisonGroup[type],
            ...deleteKeys,
          }),
        );
      }

    });

    // Calculate the number of sampleIds.
    // if there is only 1 sample, set sample using sample name
    const samples = hierarchy?.find(
      (rootNode) => (rootNode.key === 'sample'),
    )?.children;

    setNumSamples(samples.length)

    if (samples.length === 1) {
      comparisonGroup[selectedComparison]['basis'] = `sample/${samples[0].key}`
    }

    setSampleKeys(samples.map(sample => sample.key));

  }, [hierarchy, properties]);

  const cellIdToSampleMap = useMemo(() => {
    const mapping = [];
    sampleKeys.forEach((key, idx) => {
      const cellIds = properties[key].cellIds;
      cellIds.forEach(cellId => mapping[cellId] = idx);
    });

    return mapping;
  }, [numSamples]);

  // Returns true if each of the compared groups is made up of at least
  // 1 sample with more cells than a given minimum threshold.

  const canRunDiffExpr = useCallback(() => {

    if (selectedComparison === ComparisonType.WITHIN) return canRunDiffExprResults.TRUE;
    if (!basis || !cellSet || !compareWith || !cellIdToSampleMap.length > 0) { return canRunDiffExprResults.FALSE; }

    return checkCanRunDiffExpr(
      properties,
      hierarchy,
      numSamples,
      sampleKeys,
      cellIdToSampleMap,
      comparisonGroup,
      selectedComparison,
      canRunDiffExprResults
    );

  }, [basis, cellSet, compareWith, numSamples]);

  const validateForm = () => {
    if (!cellSet || !compareWith || !basis) {
      setIsFormValid(false);
      return;
    }

    if (
      selectedComparison === ComparisonType.BETWEEN
      && compareWith !== 'background'
      && getRootKey(cellSet) !== getRootKey(compareWith)
    ) {
      setIsFormValid(false);
      return;
    }

    setIsFormValid(true);
  };

  // Validate form when the groups selected changes.
  useEffect(() => {
    validateForm();
  }, [comparisonGroup[selectedComparison]]);

  /**
   * Updates the selected clusters.
   * @param {string} cellSet The key of the cell set.
   * @param {string} option The option string (`cellSet` or `compareWith`).
   */
  const onSelectCluster = (cellSet, option) => {
    dispatch(setComparisonGroup({
      ...comparisonGroup[selectedComparison],
      type: selectedComparison,
      [option]:
        cellSet,
    }));
  };

  /**
   * Constructs a form item, a `Select` field with selectable clusters.
   */
  const renderClusterSelectorItem = ({
    title, option, filterType,
  }) => {
    // Depending on the cell set type specified, set the default name
    const placeholder = filterType === 'metadataCategorical' ? 'sample/group' : 'cell set';

    const tree = composeTree(hierarchy, properties, filterType);

    const renderChildren = (rootKey, children) => {
      if (!children || children.length === 0) { return (<></>); }

      // If this is the `compareWith` option, we need to add `the rest` under the group previously selected.
      if (option === 'compareWith' && comparisonGroup[selectedComparison]?.cellSet?.startsWith(`${rootKey}/`)) {
        children.unshift({ key: `rest`, name: `Rest of ${properties[rootKey].name}` });
      }

      const shouldDisable = (rootKey, key) => {
        // Should always disable something already selected.
        const isAlreadySelected = Object.values(comparisonGroup[selectedComparison]).includes(`${rootKey}/${key}`);

        // or a cell set that is not in the same group as selected previously in `cellSet`
        const parentGroup = getRootKey(comparisonGroup[selectedComparison]?.cellSet);
        const isNotInTheSameGroup = rootKey !== parentGroup;

        return isAlreadySelected || (option === 'compareWith' && isNotInTheSameGroup);
      }

      if (comparisonGroup[selectedComparison]) {
        return children.map(({ key, name }) => {
          const uniqueKey = `${rootKey}/${key}`;

          return <Option key={uniqueKey} disabled={shouldDisable(rootKey, key)}>
            {name}
          </Option>
        });
      }
    };

    return (
      <Form.Item label={title}>
        <Select
          placeholder={`Select a ${placeholder}...`}
          style={{ width: 200 }}
          onChange={(cellSet) => onSelectCluster(cellSet, option)}
          value={comparisonGroup[selectedComparison][option] ?? null}
          size='small'
          aria-label={title}
        >
          {
            option === 'basis' &&
            <Option key='all'>
              All
            </Option>
          }
          {
            option === 'compareWith' &&
            <Option key='background'>
              All other cells
            </Option>
          }
          {
            tree && tree.map(({ key, children }) => (
              <OptGroup label={properties[key]?.name} key={key}>
                {renderChildren(key, [...children])}
              </OptGroup>
            ))
          }
        </Select>
      </Form.Item >
    );
  };

  return (
    <Form size='small' layout='vertical'>
      <Radio.Group
        onChange={(e) => {
          dispatch(setComparisonType(e.target.value));
        }} defaultValue={selectedComparison}>
        <Radio
          value={ComparisonType.WITHIN}>
          <Space>
            Compare cell sets within a sample/group
            <Tooltip overlay={(
              <span>
                This is useful for finding marker genes that distinguish one cluster from another. The calculation uses the presto implementation of the Wilcoxon rank sum test and auROC analysis. For more information see the
                {' '}
                <a
                  href='http://htmlpreview.github.io/?https://github.com/immunogenomics/presto/blob/master/docs/getting-started.html'
                  target='_blank'
                  rel='noreferrer'
                >
                  presto vignette
                </a>.
              </span>
            )}
            >
              <InfoCircleOutlined />
            </Tooltip>
          </Space>
        </Radio>
        <Radio
          value={ComparisonType.BETWEEN}
          disabled={numSamples === 1}
        >
          <Space>
            {
              numSamples === 1 ? (
                <Tooltip
                  overlay={(<span>Comparison between samples/groups is not possible with a dataset that contains only 1 sample</span>)}
                >
                  Compare a selected cell set between samples/groups
                </Tooltip>
              ) : (
                'Compare a selected cell set between samples/groups'
              )
            }
            <Tooltip overlay={(
              <span>
                This is useful for finding differentially expressed genes when comparing two experimental groups. This analysis uses a
                {' '}
                <a
                  href='http://bioconductor.org/books/3.14/OSCA.workflows/segerstolpe-human-pancreas-smart-seq2.html#segerstolpe-comparison'
                  target='_blank'
                  rel='noreferrer'
                >
                  limma-voom workflow
                </a>.
              </span>
            )}
            >
              <InfoCircleOutlined />
            </Tooltip>
          </Space>
        </Radio>
      </Radio.Group>

      {selectedComparison === ComparisonType.WITHIN
        ? (
          <>
            {renderClusterSelectorItem({
              title: 'Compare cell set:',
              option: 'cellSet',
              filterType: 'cellSets',
            })}

            {renderClusterSelectorItem({
              title: 'and cell set:',
              option: 'compareWith',
              filterType: 'cellSets',
            })}

            {renderClusterSelectorItem({
              title: 'within sample/group:',
              option: 'basis',
              filterType: 'metadataCategorical',
            })}
          </>
        ) : (
          <>
            {renderClusterSelectorItem({
              title: 'Compare cell set:',
              option: 'basis',
              filterType: 'cellSets',
            })}

            {renderClusterSelectorItem({
              title: 'between sample/group:',
              option: 'cellSet',
              filterType: 'metadataCategorical',
            })}

            {renderClusterSelectorItem({
              title: 'and sample/group:',
              option: 'compareWith',
              filterType: 'metadataCategorical',
            })}
          </>
        )}
      <Space direction='vertical'>
        {
          isFormValid && canRunDiffExpr() === canRunDiffExprResults.INSUFFCIENT_CELLS_ERROR ?
            <Alert
              message="Error"
              description={
                <>
                  One or more of the selected samples/groups does not contain enough cells in the selected cell set.
                  Therefore, the analysis can not be run. Select other cell set(s) or samples/groups to compare.
                </>
              }
              type="error"
              showIcon
            /> :
            isFormValid && canRunDiffExpr() === canRunDiffExprResults.INSUFFICIENT_CELLS_WARNING ?
              <Alert
                message="Warning"
                description={
                  <>
                    For the selected comparison, there are fewer than 3 samples with the recommended minimum number of cells (10).
                    Only logFC values will be calculated and results should be used for exploratory purposes only.
                  </>
                }
                type="warning"
                showIcon
              />
              :
              <></>
        }
        <Space direction='horizontal'>
          <Button
            size='small'
            disabled={!isFormValid ||
              [
                canRunDiffExprResults.FALSE,
                canRunDiffExprResults.INSUFFCIENT_CELLS_ERROR
              ].includes(canRunDiffExpr())
            }
            onClick={() => onCompute()}
          >
            Compute
          </Button>
        </Space>
      </Space>
    </Form>
  );
};

DiffExprCompute.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onCompute: PropTypes.func.isRequired,
};

export default DiffExprCompute;
