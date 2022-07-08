const _ = require('lodash');

const fileTypes = {
  matrix: 'matrix10x',
  barcodes: 'barcodes10x',
  features: 'features10x',
  genes: 'features10x',
  seurat: 'r.rds',
};

const getFileTypeV2 = (fileName) => {
  let fileType;

  console.log('getFileTypeV2');
  console.log(`fileType ${fileType}`);

  _.forEach(Object.entries(fileTypes), ([name, type]) => {
    if (fileName.includes(name)) {
      fileType = type;
      return false;
    }
  });

  return fileType;
};

export default getFileTypeV2;
