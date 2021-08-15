// import backendStatusReducer from '../../../redux/reducers/backendStatus';
// import initialState from '../../../redux/reducers/backendStatus/initialState';

/* eslint-disable max-len */
describe('backendStatusReducer.test.js', () => {
  it('updates backend status on error properly', () => {
    // const newState = backendStatusReducer(initialExperimentState,
    //   {
    //     type: EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
    //     payload:
    //     {
    //       error: 'error',
    //     },
    //   });

    // const newState = backendStatusReducer(initialExperimentState,
    //   {
    //     type: 'fail',
    //     payload:
    //     {
    //       error: 'error',
    //     },
    //   });

    // expect(newState.backendStatus.error).toEqual('error');

    // // Nothing else changes
    // expect(newState).toMatchSnapshot();
  });

  it('updates backend status on loading properly', () => {
    // const newState = backendStatusReducer(initialExperimentState,
    //   { type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING });

    // const newState = backendStatusReducer(initialExperimentState,
    //   {
    //     type: 'fail',
    //     payload:
    //     {
    //       error: 'error',
    //     },
    //   });

    // expect(newState.backendStatus.loading).toEqual(true);
    // expect(newState.backendStatus.error).toEqual(false);

    // // Nothing else changes
    // expect(newState).toMatchSnapshot();
  });

  it('updates backend status on loaded properly', () => {
    // const initialExperimentStateWithPipelineStatus = _.cloneDeep(initialExperimentState);

    // initialExperimentStateWithPipelineStatus.backendStatus.status.pipeline = { status: 'NotCreated' };

    // const newState = backendStatusReducer(initialExperimentStateWithPipelineStatus,
    //   {
    //     type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
    //     payload: {
    //       status: {
    //         gem2s: { status: 'Running' },
    //       },
    //     },
    //   });

    // const newState = backendStatusReducer(initialExperimentState,
    //   {
    //     type: 'fail',
    //     payload:
    //     {
    //       error: 'error',
    //     },
    //   });

    // // Sets backend load states correctly
    // expect(newState.backendStatus.loading).toEqual(false);
    // expect(newState.backendStatus.error).toEqual(false);

    // // New state of updated service is there
    // expect(newState.backendStatus.status.gem2s.status).toEqual('Running');

    // // Previous state of another service is still there
    // expect(newState.backendStatus.status.pipeline.status).toEqual('NotCreated');

    // // Nothing else changes
    // expect(newState).toMatchSnapshot();
  });
});
