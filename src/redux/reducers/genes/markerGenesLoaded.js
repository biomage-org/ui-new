/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

import { calculateZScore } from '../../../utils/postRequestProcessing';

const markerGenesLoaded = produce((draft, action) => {
  const { data, genes, plotUuid } = action.payload;
  const dataWithZScore = calculateZScore(data);
  draft.expression.views[plotUuid] = { fetching: false, error: false, data: genes };

  draft.expression.data = { ...draft.expression.data, ...dataWithZScore };

  draft.markers.loading = false;
  draft.markers.error = false;
  draft.markers.order = genes;
}, initialState);

export default markerGenesLoaded;
