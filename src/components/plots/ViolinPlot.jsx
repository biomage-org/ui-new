import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import 'vega-webgl-renderer';

import { getCellSets, getCellSetsHierarchyByKeys } from 'redux/selectors';

import { generateSpec, generateData } from 'utils/plotSpecs/generateViolinSpec';
import { loadCellSets } from 'redux/actions/cellSets';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';

const ViolinPlot = (props) => {
  const {
    experimentId, plotUuid,
  } = props;
  const dispatch = useDispatch();

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);

  const geneExpression = useSelector((state) => state.genes.expression);
  const cellSets = useSelector(getCellSets());

  const selectedCellSetClassAvailable = useSelector(
    getCellSetsHierarchyByKeys([config?.selectedCellSet]),
  ).length;

  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    if (config
      && !geneExpression.error
      && geneExpression.matrix.geneIsLoaded(config.shownGene)
      && cellSets.accessible) {
      const geneExpressionData = config.normalised === 'normalised'
        ? geneExpression.matrix.getZScore(config.shownGene)
        : geneExpression.matrix.getRawExpression(config.shownGene);

      if (selectedCellSetClassAvailable) {
        const generatedPlotData = generateData(
          cellSets,
          geneExpressionData,
          config?.selectedCellSet,
          config?.selectedPoints,
        );
        setPlotSpec(generateSpec(config, generatedPlotData));
      }
    }
  }, [experimentId, config, geneExpression, cellSets]);

  const render = () => {
    if (!config || config?.shownGene === 'notSelected') return <Loader experimentId={experimentId} />;

    if (cellSets.error) {
      return (
        <PlatformError
          error={cellSets.error}
          reason={cellSets.error}
          onClick={() => {
            dispatch(loadCellSets(experimentId));
          }}
        />
      );
    }

    if (
      geneExpression.loading.includes(config?.shownGene)
      || !cellSets.accessible
    ) {
      return <Loader experimentId={experimentId} />;
    }

    return <Vega spec={plotSpec} renderer='webgl' />;
  };

  return render();
};

ViolinPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
};

export default ViolinPlot;
