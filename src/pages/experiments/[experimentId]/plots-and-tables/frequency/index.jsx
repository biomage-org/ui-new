/* eslint-disable import/no-unresolved */
/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Collapse,
  Skeleton,
  Radio,
  Alert,
  Space,
} from 'antd';
import Link from 'next/link';

import Header from 'components/Header';
import Loader from 'components/Loader';
import PlatformError from 'components/PlatformError';
import FrequencyPlot from 'components/plots/FrequencyPlot';
import ExportAsCSV from 'components/plots/ExportAsCSV';

import { getCellSets, getCellSetsHierarchyByKeys } from 'redux/selectors';
import SelectCellSets from 'components/plots/styling/frequency/SelectCellSets';

import { updatePlotConfig, loadPlotConfig } from 'redux/actions/componentConfig';
import loadCellSets from 'redux/actions/cellSets/loadCellSets';

import plotCsvFilename from 'utils/fileNames';
import { plotNames } from 'utils/constants';
import PlotContainer from 'components/plots/PlotContainer';

import PlotLegendAlert, { MAX_LEGEND_ITEMS } from 'components/plots/helpers/PlotLegendAlert';

const { Panel } = Collapse;

const plotUuid = 'frequencyPlotMain';
const plotType = 'frequency';
const dataExplorationPath = '/experiments/[experimentId]/data-exploration';

const FrequencyPlotPage = ({ experimentId }) => {
  const dispatch = useDispatch();

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const configIsLoaded = useSelector((state) => !_.isNil(state.componentConfig[plotUuid]));

  const cellSets = useSelector(getCellSets());

  const [cellSetClusters] = useSelector(
    getCellSetsHierarchyByKeys([config?.proportionGrouping]),
  );

  const numLegendItems = useSelector(
    getCellSetsHierarchyByKeys([config?.proportionGrouping]),
  )[0]?.children?.length;

  const experimentName = useSelector((state) => state.experimentSettings.info.experimentName);

  const [csvData, setCsvData] = useState([]);
  const [csvFilename, setCsvFilename] = useState('');

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, []);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  useEffect(() => {
    if (!configIsLoaded
      || !cellSets.accessible
      || !config.legend.enabled) return;

    const showAlert = numLegendItems > MAX_LEGEND_ITEMS;

    if (showAlert) updatePlotWithChanges({ legend: { showAlert, enabled: !showAlert } });
  }, [configIsLoaded, cellSets.accessible]);

  const plotStylingConfig = [
    {
      panelTitle: 'Main schema',
      controls: ['dimensions'],
      children: [
        {
          panelTitle: 'Title',
          controls: ['title'],
        },
        {
          panelTitle: 'Font',
          controls: ['font'],
        },
      ],
    },
    {
      panelTitle: 'Axes and margins',
      controls: ['axesWithRanges'],
    },
    {
      panelTitle: 'Legend',
      footer: <Alert
        message={
          ['Changing cell set colours is not currently available here. Use the Cell sets and Metadata tool in ',
            <Link as={dataExplorationPath.replace('[experimentId]', experimentId)} href={dataExplorationPath} passHref>Data Exploration</Link>,
            ' to customise cell set colours.']
        }
        type='info'
      />,
      controls: [
        {
          name: 'legend',
          props: {
            option: {
              positions: 'top-bottom',
            },
          },
        },
      ],
    },
  ];

  if (!config) {
    return <Skeleton />;
  }

  const formatCSVData = (plotData) => {
    const newCsvData = [];

    cellSetClusters.children.forEach((cluster) => {
      const entriesForCluster = plotData.filter((entry) => entry.yCellSetKey === cluster.key);

      const cellSetName = cellSets.properties[cluster.key].name;
      const rootCellSetName = cellSets.properties[config.proportionGrouping].name;
      const newEntry = { [rootCellSetName]: cellSetName };

      entriesForCluster.forEach((entry) => {
        const sampleName = cellSets.properties[entry.x].name;
        newEntry[sampleName] = entry.y;
      });
      newCsvData.push(newEntry);
    });

    setCsvFilename(plotCsvFilename(experimentName, 'FREQUENCY_PLOT', [config.frequencyType]));
    setCsvData(newCsvData);
  };

  const changePlotType = (value) => {
    const chosenType = value.target.value;

    updatePlotWithChanges({
      frequencyType: chosenType,
      axes: { yAxisText: chosenType === 'proportional' ? 'Proportion' : 'Count' },
    });
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Select data' key='select-data'>
        <SelectCellSets
          config={config}
          onUpdate={updatePlotWithChanges}
        />
      </Panel>
      <Panel header='Plot type' key='plot-type'>
        <Radio.Group
          onChange={(value) => changePlotType(value)}
          value={config.frequencyType}
        >
          <Radio value='proportional'>Proportional</Radio>
          <Radio value='count'>Count</Radio>
        </Radio.Group>
      </Panel>
    </>
  );

  const renderPlot = () => {
    if (cellSets.error) {
      return (
        <PlatformError
          description={cellSets.error}
          onClick={() => loadCellSets(experimentId)}
        />
      );
    }
    if (!config || !cellSets.accessible) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <Space direction='vertical'>
        {config?.legend?.showAlert && <PlotLegendAlert />}
        <center>
          <FrequencyPlot
            experimentId={experimentId}
            config={config}
            formatCSVData={formatCSVData}
          />
        </center>
      </Space>
    );
  };

  return (
    <>
      <Header title={plotNames.FREQUENCY_PLOT} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        extraToolbarControls={<ExportAsCSV data={csvData} filename={csvFilename} />}
        extraControlPanels={renderExtraPanels()}
        defaultActiveKey='select-data'
      >
        {renderPlot()}
      </PlotContainer>
    </>
  );
};

FrequencyPlotPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default FrequencyPlotPage;
