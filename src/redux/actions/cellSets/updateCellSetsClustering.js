import {
  CELL_SETS_ERROR, CELL_SETS_CLUSTERING_UPDATING, CELL_SETS_CLUSTERING_UPDATED,
} from '../../actionTypes/cellSets';
import sendWork from '../../../utils/sendWork';
import saveCellSets from './saveCellSets';

const REQUEST_TIMEOUT = 30;

const updateCellSetsClustering = (experimentId, resolution) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  const body = {
    name: 'ClusterCells',
    cellSetName: 'Louvain clusters',
    type: 'louvain',
    cellSetKey: 'louvain',
    config: {
      resolution,
    },
  };

  dispatch({
    type: CELL_SETS_CLUSTERING_UPDATING,
  });

  try {
    const response = await sendWork(
      experimentId, REQUEST_TIMEOUT, body,
    );

    const louvainSets = JSON.parse(response.results[0].body);

    const newCellSets = [
      louvainSets,
    ];

    await dispatch({
      type: CELL_SETS_CLUSTERING_UPDATED,
      payload: {
        experimentId,
        data: newCellSets,
      },
    });
    dispatch(saveCellSets(experimentId));
  } catch (e) {
    dispatch({
      type: CELL_SETS_ERROR,
      payload: {
        experimentId,
        error: e,
      },
    });
  }
};

export default updateCellSetsClustering;