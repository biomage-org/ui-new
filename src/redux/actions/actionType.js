
const CELL_SETS = 'CELL_SETS';
const LOAD_CELL_SETS = `${CELL_SETS}.LOAD`;
const UPDATE_CELL_SETS = `${CELL_SETS}.UPDATE`;
const CREATE_CLUSTER = `${CELL_SETS}.CREATE`;
const CELL_SETS_COLOR = `${CELL_SETS}.COLOR`;
const PUSH_CELL_SETS = `${CELL_SETS}.PUSH`;

const CELLS = 'CELLS';
const LOAD_CELLS = `${CELLS}.LOAD`;

const GENE_LIST = 'GENE_LIST';
const LOAD_GENE_LIST = `${GENE_LIST}.LOAD`;
const UPDATE_GENE_LIST = `${GENE_LIST}.UPDATE`;

const DIFF_EXPR = 'DIFF_EXPR';
const LOAD_DIFF_EXPR = `${DIFF_EXPR}.LOAD`;
const UPDATE_DIFF_EXPR = `${DIFF_EXPR}.UPDATE`;

const SELECTED_GENES = 'SELECTED_GENES';

const BUILD_HEATMAP_SPEC = 'BUILD_HEATMAP_SPEC';
const UPDATE_GENE_EXPRESSION = 'UPDATE_GENE_EXPRESSION';
const UPDATE_HEATMAP_SPEC = 'UPDATE_HEATMAP_SPEC';

const UPDATE_CELL_INFO = 'UPDATE_CELL_INFO';

export {
  LOAD_CELL_SETS, UPDATE_CELL_SETS, PUSH_CELL_SETS, CREATE_CLUSTER, LOAD_CELLS,
  CELL_SETS_COLOR,
  LOAD_GENE_LIST, UPDATE_GENE_LIST, SELECTED_GENES, BUILD_HEATMAP_SPEC,
  UPDATE_GENE_EXPRESSION, UPDATE_HEATMAP_SPEC, LOAD_DIFF_EXPR, UPDATE_DIFF_EXPR,
  UPDATE_CELL_INFO,
};
