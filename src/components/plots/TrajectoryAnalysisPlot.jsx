/* eslint-disable camelcase */
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import { generateData as generateCategoricalEmbeddingData } from 'utils/plotSpecs/generateEmbeddingCategoricalSpec';
import {
  generateSpec,
  generateData as generateTrajectoryPathData,
} from 'utils/plotSpecs/generateTrajectoryAnalysisGraph';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';

import { getCellSets } from 'redux/selectors';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';
import changeEmbeddingAxesIfNecessary from 'components/plots/helpers/changeEmbeddingAxesIfNecessary';

const TrajectoryAnalysisPlot = (props) => {
  const {
    experimentId,
    config,
    plotData,
    actions,
    onUpdate,
    onSelectNode,
    resetPlot,
  } = props;
  const dispatch = useDispatch();

  const [plotSpec, setPlotSpec] = useState({});

  const cellSets = useSelector(getCellSets());

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector(
    (state) => state.embeddings[embeddingSettings?.method],
  ) || {};

  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }

    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (!embeddingData && embeddingSettings?.method) {
      dispatch(loadEmbedding(experimentId, embeddingSettings?.method));
    }
  }, [experimentId, embeddingSettings?.method]);

  useEffect(() => {
    changeEmbeddingAxesIfNecessary(config, embeddingSettings?.method, onUpdate);
  }, [config, embeddingSettings?.method]);

  useEffect(() => {
    if (
      !config
      || cellSets.loading
      || cellSets.error
      || !embeddingData?.length
      || !plotData
      || !plotData?.nodes
    ) {
      return;
    }

    const {
      plotData: plotEmbedding,
      cellSetLegendsData,
    } = generateCategoricalEmbeddingData(
      cellSets,
      config.selectedSample,
      config.selectedCellSet,
      embeddingData,
    );

    const trajectoryData = generateTrajectoryPathData(plotData);

    setPlotSpec(
      generateSpec(
        config,
        plotEmbedding,
        trajectoryData,
        cellSetLegendsData,
        resetPlot,
      ),
    );
  }, [config, cellSets, embeddingData, plotData, resetPlot]);

  const plotListener = {
    chooseNode: (eventName, payload) => {
      const { node_id } = payload;
      onSelectNode(node_id);
    },
  };

  const render = () => {
    if (cellSets.error) {
      return (
        <PlatformError
          error={cellSets.error}
          onClick={() => { dispatch(loadCellSets(experimentId)); }}
        />
      );
    }

    if (embeddingError) {
      return (
        <PlatformError
          error={embeddingError}
          onClick={() => { dispatch(loadEmbedding(experimentId, embeddingSettings?.method)); }}
        />
      );
    }

    if (!config
      || cellSets.loading
      || !embeddingData
      || embeddingLoading
      || Object.keys(plotSpec).length === 0
    ) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <center>
        <Vega
          spec={plotSpec}
          renderer='canvas'
          actions={actions}
          signalListeners={plotListener}
        />
      </center>
    );
  };

  return (
    <>
      {render()}
    </>
  );
};

TrajectoryAnalysisPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  plotData: PropTypes.object.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  onUpdate: PropTypes.func.isRequired,
  onSelectNode: PropTypes.func,
  resetPlot: PropTypes.bool,
};

TrajectoryAnalysisPlot.defaultProps = {
  actions: true,
  config: null,
  onSelectNode: () => {},
  resetPlot: false,
};

export default TrajectoryAnalysisPlot;
