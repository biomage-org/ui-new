/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import { calculateZScore } from 'utils/postRequestProcessing';
import initialState from 'redux/reducers/genes/initialState';

const markerGenesLoaded = produce((draft, action) => {
  const {
    plotUuid,
    data: {
      order,
      rawExpression,
      truncatedExpression,
      stats,
    },
  } = action.payload;

  console.log('plotUuidDebug');
  console.log(plotUuid);

  console.log('actionspayloaddataDebug');
  console.log(action.payload.data);

  // // const dataWithZScore = calculateZScore(data);
  // draft.expression.views[plotUuid] = { fetching: false, error: false, data: order };

  // const expressionMatrix = original(draft.expression.matrix);
  const expressionMatrix = original(draft).expression.matrix;

  expressionMatrix.pushGeneExpression(
    order,
    rawExpression,
    truncatedExpression,
  );

  draft.expression.views[plotUuid] = { fetching: false, error: false, data: order };

  // const currentTruncatedExpressionExpression = current(draft.expression.data.truncatedExpression);

  // order.forEach((geneSymbol, index) => {
  //   draft.expression.data.rawExpression.
  // });

  // draft.expression.data.rawExpression;

  // draft.expression.stats = {
  //   ...draft.expression.stats,
  //   stats,
  // };

  // // draft.expression.data = { ...draft.expression.data };

  draft.markers.loading = false;
  draft.markers.error = false;
}, initialState);

export default markerGenesLoaded;
