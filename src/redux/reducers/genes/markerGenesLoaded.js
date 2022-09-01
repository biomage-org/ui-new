/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

// import { calculateZScore } from 'utils/postRequestProcessing';
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

  // // const dataWithZScore = calculateZScore(data);
  // draft.expression.views[plotUuid] = { fetching: false, error: false, data: order };

  // const expressionMatrix = original(draft.expression.matrix);

  console.log('[DEBUG] - BEGUN GETTING GENE EXPRESSION MATRIX');
  const expressionMatrix = original(draft).expression.matrix;
  console.log('[DEBUG] - FINISHED GETTING GENE EXPRESSION MATRIX');

  console.log('[DEBUG] - BEGUN SETTING GENE EXPRESSION MATRIX');
  // expressionMatrix.setGeneExpression(
  //   order,
  //   rawExpression,
  //   truncatedExpression,
  //   stats,
  // );
  expressionMatrix.pushGeneExpression(
    order,
    rawExpression,
    truncatedExpression,
    stats,
  );
  console.log('[DEBUG] - FINISHED SETTING GENE EXPRESSION');

  draft.expression.views[plotUuid] = { fetching: false, error: false, data: order };

  // eslint-disable-next-line max-len
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
