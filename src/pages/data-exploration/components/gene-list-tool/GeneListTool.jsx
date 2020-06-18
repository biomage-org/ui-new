import React, { useState } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';

import {
  Table, Space,
} from 'antd';

import PropTypes from 'prop-types';
import FilterGenes from './FilterGenes';
import {
  updateGeneList,
  updateSelectedGenes,
  loadGeneExpression,
} from '../../../../redux/actions';

const GeneListTool = (props) => {
  const { experimentID } = props;
  const dispatch = useDispatch();

  const isLoading = useSelector((state) => state.geneList.loading);
  const rows = useSelector((state) => state.geneList.rows);
  const tableState = useSelector((state) => state.geneList.tableState);
  const [geneNamesFilter, setGeneNamesFilter] = useState(null);
  const selectedGenes = useSelector((state) => state.selectedGenes);
  const selectedRowKeys = selectedGenes.geneList ? Object.keys(selectedGenes.geneList) : [];

  if (!tableState) {
    const defaultState = {
      pagination: {
        current: 1,
        pageSize: 50,
        showSizeChanger: true,
        total: 1,
      },
      sorter: {
        field: 'dispersions',
        order: 'descend',
      },
      geneNamesFilter,
    };

    dispatch(updateGeneList(experimentID, defaultState));
  }

  const getSortOrderIfExists = (key) => {
    if (key === tableState?.sorter.columnKey) {
      return tableState.sorter.order;
    }
    return null;
  };

  const columns = [
    {
      title: 'Gene',
      dataIndex: 'gene_names',
      key: 'gene_names',
      sorter: true,
      render: (geneName) => (
        <a
          href={`https://www.genecards.org/cgi-bin/carddisp.pl?gene=${geneName}`}
          target='_blank'
          rel='noreferrer'
        >
          {geneName}
        </a>
      ),
      sortOrder: getSortOrderIfExists('gene_names'),
    },
    {
      title: 'Dispersion',
      dataIndex: 'dispersions',
      key: 'dispersions',
      sorter: true,
      sortOrder: getSortOrderIfExists('dispersions'),
      render: (num) => parseFloat(num.toFixed(3)),
    },
  ];

  const handleTableChange = (newPagination, _, newSorter) => {
    const newTableState = { pagination: newPagination, sorter: { ...newSorter }, geneNamesFilter };
    dispatch(updateGeneList(experimentID, newTableState));
  };

  const filterGenes = (searchPattern) => {
    const newTableState = {
      pagination: tableState.pagination,
      sorter: { ...tableState.sorter },
      geneNamesFilter: searchPattern,
    };
    dispatch(updateGeneList(experimentID, newTableState));
    setGeneNamesFilter(searchPattern);
  };

  const rowSelection = {
    onSelect: (gene, selected) => {
      dispatch(updateSelectedGenes([gene.key], selected, experimentID));
      dispatch(loadGeneExpression(experimentID));
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
      const genes = [];
      changeRows.forEach((row) => genes.push(row.gene_names));
      dispatch(updateSelectedGenes(genes, selected, experimentID));
      dispatch(loadGeneExpression(experimentID));
    },
  };

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <FilterGenes filterGenes={filterGenes} />
      <Table
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        size='small'
        pagination={tableState?.pagination}
        sorter={tableState?.sorter}
        scroll={{ x: 200, y: 500 }}
        onChange={handleTableChange}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          ...rowSelection,
        }}
      />
    </Space>
  );
};


GeneListTool.defaultProps = {};

GeneListTool.propTypes = {
  experimentID: PropTypes.string.isRequired,
};

export default GeneListTool;