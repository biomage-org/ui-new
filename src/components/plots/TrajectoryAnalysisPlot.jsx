import React, {
  useState, useEffect, useMemo, forwardRef, useRef,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import 'vega-webgl-renderer';

import { generateData as generateEmbeddingCategoricalData } from 'utils/plotSpecs/generateEmbeddingCategoricalSpec';
import {
  generateTrajectoryAnalysisSpec,
  generateStartingNodesData,
  generatePseudotimeData,
} from 'utils/plotSpecs/generateTrajectoryAnalysisSpec';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';

import { getCellSets } from 'redux/selectors';

import { Alert } from 'antd';
import Loader from 'components/Loader';

import changeEmbeddingAxesIfNecessary from 'components/plots/helpers/changeEmbeddingAxesIfNecessary';

const TrajectoryAnalysisPlot = forwardRef((props, ref) => {
  // Currenty monocle3 trajectory analysis only supports
  // UMAP embedding. Therefore, this embedding is specifically fetched.
  const embeddingMethod = 'umap';

  const {
    experimentId,
    plotState,
    plotUuid,
    actions,
    onUpdate,
    onClickNode,
    onLassoSelection,
    resetZoomCount,
  } = props;

  const dispatch = useDispatch();
  const resetZoomCountRef = useRef(0);

  const [plotSpec, setPlotSpec] = useState({});

  const cellSets = useSelector(getCellSets());

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  const {
    config,
    plotData: startingNodesPlotData,
  } = useSelector((state) => state.componentConfig[plotUuid]) || {};

  const {
    data: embeddingData,
  } = useSelector(
    (state) => state.embeddings[embeddingMethod],
  ) || {};

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }
  }, [experimentId]);

  useEffect(() => {
    if (!embeddingData
      && embeddingMethod
      && embeddingSettings
    ) {
      dispatch(loadEmbedding(experimentId, embeddingMethod));
    }
  }, [experimentId, embeddingMethod, embeddingSettings]);

  useEffect(() => {
    changeEmbeddingAxesIfNecessary(config, embeddingMethod, onUpdate);
  }, [config, embeddingMethod]);

  const { plotData: embeddingPlotData, cellSetLegendsData } = useMemo(() => {
    if (
      !config
      || !cellSets.accessible
      || cellSets.error
      || !embeddingData?.length
    ) return {};

    return generateEmbeddingCategoricalData(
      cellSets,
      config.selectedSample,
      config.selectedCellSet,
      embeddingData,
    );
  }, [config, cellSets, embeddingData]);

  const startingNodesData = useMemo(() => {
    if (
      !startingNodesPlotData
      || !startingNodesPlotData?.nodes
    ) return;

    return generateStartingNodesData(startingNodesPlotData.nodes);
  }, [startingNodesPlotData?.nodes]);

  const pseudotimeData = useMemo(() => {
    if (
      !config
      || !startingNodesPlotData
      || !startingNodesPlotData?.pseudotime
    ) return;

    return generatePseudotimeData(
      cellSets,
      startingNodesPlotData.pseudotime,
      embeddingData,
    );
  }, [
    embeddingData,
    cellSets,
    startingNodesPlotData?.pseudotime,
    config?.selectedNodes,
  ]);

  useEffect(() => {
    if (
      !embeddingPlotData
      || !cellSetLegendsData
      || !startingNodesPlotData?.nodes
    ) return;

    resetZoomCountRef.current = resetZoomCount;

    const selectedNodeIds = config.selectedNodes.map(
      (nodeId) => startingNodesPlotData.nodes[nodeId],
    );

    setPlotSpec(
      generateTrajectoryAnalysisSpec(
        config,
        ref.current,
        plotState,
        embeddingPlotData,
        pseudotimeData,
        cellSetLegendsData,
        startingNodesData,
        selectedNodeIds,
      ),
    );
  }, [
    config,
    cellSets,
    embeddingData,
    pseudotimeData,
    startingNodesPlotData,
    plotState.displayPseudotime,
    plotState.displayTrajectory,
    resetZoomCount,
  ]);

  const plotListeners = {
    domUpdates: (e, val) => {
      const [xdom, ydom] = val;
      // eslint-disable-next-line no-param-reassign
      ref.current = { xdom, ydom };
    },
    addNode: (eventName, payload) => {
      // eslint-disable-next-line camelcase
      const { node_id } = payload;

      onClickNode('add', node_id);
    },
    removeNode: (eventName, payload) => {
      // eslint-disable-next-line camelcase
      const { node_id } = payload;

      onClickNode('remove', node_id);
    },
    lassoSelection: (eventName, payload) => {
      const [x1, y1, x2, y2] = payload;

      const xStart = Math.min(x1, x2);
      const xEnd = Math.max(x1, x2);
      const yStart = Math.min(y1, y2);
      const yEnd = Math.max(y1, y2);

      const inSelection = (node) => {
        const isInSelection = (
          xStart <= node.x && node.x <= xEnd
          && yStart <= node.y && node.y <= yEnd
        );

        return isInSelection ? node.node_id : null;
      };

      const selectedNodes = Object.values(startingNodesPlotData.nodes)
        .map((node) => (inSelection(node) ? node.node_id : null))
        .filter((node) => node !== null);

      onLassoSelection(selectedNodes);
    },
  };

  const render = () => {
    if (resetZoomCountRef.current !== resetZoomCount) return <Loader />;

    return (
      <center>
        {embeddingSettings?.method === 'tsne' && (
          <Alert
            type='warning'
            message={(
              <>
                Due to
                {' '}
                <a href='https://cole-trapnell-lab.github.io/monocle3/' target='_blank' rel='noreferrer'>Monocle3</a>
                {' '}
                limitations, only UMAP embeddings are supported for Trajectory Analysis.
                <br />
                The embedding and trajectory below are generated from a UMAP embedding of your data.
              </>
            )}
          />
        )}
        <br />
        <Vega
          spec={plotSpec}
          renderer='webgl'
          actions={actions}
          signalListeners={plotState.displayTrajectory ? plotListeners : {}}
        />
      </center>
    );
  };

  return render();
});

TrajectoryAnalysisPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
  plotState: PropTypes.object.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  resetZoomCount: PropTypes.number,
  onUpdate: PropTypes.func.isRequired,
  onClickNode: PropTypes.func,
  onLassoSelection: PropTypes.func,
};

TrajectoryAnalysisPlot.defaultProps = {
  actions: true,
  resetZoomCount: 0,
  onClickNode: () => { },
  onLassoSelection: () => { },
};

export default TrajectoryAnalysisPlot;
