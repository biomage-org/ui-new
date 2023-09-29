import _ from 'lodash';

import { initialViewState } from './getInitialState';

const upperCaseArray = (array) => (array?.map((element) => element.toUpperCase()));

const genesExpressionLoaded = (state, action) => {
  const {
    componentUuid, genes,
    loadingStatus = _.difference(
      upperCaseArray(state.expression.full.loading), upperCaseArray(genes),
    ),
    newGenes = undefined,
    downsampledCellOrder = null,
  } = action.payload;

  // If there's any data to load, load it
  if (newGenes) {
    const {
      orderedGeneNames,
      rawExpression,
      truncatedExpression,
      zScore,
      stats,
    } = newGenes;

    if (downsampledCellOrder) {
      state.expression.downsampled.matrix.setGeneExpression(
        orderedGeneNames,
        rawExpression,
        truncatedExpression,
        zScore,
        stats,
      );
    } else {
      state.expression.full.matrix.pushGeneExpression(
        orderedGeneNames,
        rawExpression,
        truncatedExpression,
        zScore,
        stats,
      );
    }
  }

  return {
    ...state,
    expression: {
      ...state.expression,
      views: {
        ...state.expression.views,
        [componentUuid]: {
          ...initialViewState,
          ...state.expression.views[componentUuid],
          fetching: false,
          error: false,
          data: genes,
        },
      },
      full: {
        ...state.expression.full,
        loading: loadingStatus,
      },
      // downsampledCellOrder: downsampledCellOrder ?? state.expression.downsampledCellOrder,
    },
  };
};

export default genesExpressionLoaded;
