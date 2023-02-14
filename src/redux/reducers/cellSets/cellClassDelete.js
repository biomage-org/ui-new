/* eslint-disable no-param-reassign */
import _ from 'lodash';
import produce from 'immer';

const cellClassDelete = produce((draft, action) => {
  const { key } = action.payload;

  // Remove cellClass from hierarchy
  const cellClassIndex = draft.hierarchy.findIndex((rootNode) => rootNode.key === key);
  const cellSetKeys = draft.hierarchy[cellClassIndex].children;

  // Remove cell clas from hierarchy
  draft.hierarchy.splice(cellClassIndex, 1);

  // Delete from the properties as well.
  delete draft.properties[key];

  // Remove keys in selected cell sets
  _.remove(draft.selected.cellSets,
    (currentSelectedKey) => cellSetKeys.includes(currentSelectedKey));

  // Remove keys in selected cell sets
  cellSetKeys.forEach(({ key: cellSetKey }) => draft.hidden.delete(cellSetKey));
});

export default cellClassDelete;
