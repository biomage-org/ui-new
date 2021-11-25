import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';
import generatePlotWorkBody from 'utils/work/generatePlotWorkBody';
import { fetchWork } from 'utils/work/fetchWork';

const fetchPlotDataWork = (experimentId, plotUuid, plotType) => async (dispatch, getState) => {
  const config = getState().componentConfig[plotUuid]?.config ?? initialPlotConfigStates[plotType];
  const timeout = getTimeoutForWorkerTask(getState(), 'PlotData');

  try {
    const body = generatePlotWorkBody(plotType, config);

    dispatch({
      type: PLOT_DATA_LOADING,
      payload: { plotUuid },
    });

    const data = await fetchWork(
      experimentId, body, getState, { timeout },
    );

    dispatch({
      type: PLOT_DATA_LOADED,
      payload: {
        plotUuid,
        plotData: data,
      },
    });
  } catch (error) {
    console.error(error.message);

    dispatch({
      type: PLOT_DATA_ERROR,
      payload: {
        plotUuid,
        error: error.message,
      },
    });

    pushNotificationMessage('error', endUserMessages.ERROR_FETCHING_PLOT_DATA);
  }
};

export default fetchPlotDataWork;