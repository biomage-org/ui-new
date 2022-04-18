import React from 'react';
import { Provider } from 'react-redux';

import { screen, render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { makeStore } from 'redux/store';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import FrequencyPlot from 'components/plots/FrequencyPlot';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  delayedResponse,
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';

describe('Frequency plot tests', () => {
  const updateCSV = jest.fn();
  let storeState = null;

  const renderFrequencyPlot = () => {
    render(
      <Provider store={storeState}>
        <FrequencyPlot
          formatCSVData={updateCSV}
          config={initialPlotConfigStates.frequency}
          experimentId={fake.EXPERIMENT_ID}
        />
      </Provider>,
    );
  };
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    storeState = makeStore();

    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(fake.EXPERIMENT_ID)));
  });

  it('Updates CSV data on render', () => {
    renderFrequencyPlot();
    expect(updateCSV).toHaveBeenCalled();
  });

  it.only('Renders Loader instead of vega plot if  is being loaded', async () => {
    const cellSetErrorResponse = {
      ...generateDefaultMockAPIResponses(fake.EXPERIMENT_ID),
      [`experiments/${fake.EXPERIMENT_ID}/cellSets`]: () => delayedResponse({ body: 'Not found', status: 404 }, 4000),
    };

    fetchMock.mockIf(/.*/, mockAPI(cellSetErrorResponse));

    await act(async () => {
      renderFrequencyPlot();
    });

    expect(screen.getByText(/We're getting your data/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Vega visualization' })).toBeNull();

    expect(updateCSV).not.toHaveBeenCalled();
  });
});
