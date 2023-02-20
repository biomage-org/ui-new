import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getCellSets } from 'redux/selectors';

import {
  Select, Space,
} from 'antd';

const TrajectoryAnalysisDisplaySettings = (props) => {
  const { onChange, selectedCellSets, extraElements } = props;

  const { hierarchy, properties } = useSelector(getCellSets());

  const options = useMemo(() => {
    const result = [];

    if (!hierarchy.length) return result;

    hierarchy.forEach(({ key: parentKey, children }) => {
      result.push({ label: `All ${parentKey}`, value: properties[parentKey].name });

      const childrenOptions = children.map(({ key }) => ({
        label: properties[key].name,
        value: key,
      }));

      result.push(...childrenOptions);
    });

    return result;
  }, [hierarchy]);

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <span>Select cell sets to use for trajectory analysis</span>
      <Select
        mode='multiple'
        allowClear
        style={{ width: '100%' }}
        placeholder='Select cell sets'
        value={options.filter(({ value }) => selectedCellSets.includes(value))}
        onChange={(values) => {
          const selectedCellSetKeys = values.map(({ value }) => value);
          onChange(selectedCellSetKeys);
        }}
        options={options}
        labelInValue
        filterOption={
          (searchText, { name }) => name.toLowerCase().startsWith(searchText.toLowerCase())
        }
      />
      { extraElements }
    </Space>
  );
};

TrajectoryAnalysisDisplaySettings.propTypes = {
  onChange: PropTypes.func.isRequired,
  selectedCellSets: PropTypes.object.isRequired,
  extraElements: PropTypes.node,
};

TrajectoryAnalysisDisplaySettings.defaultProps = {
  extraElements: null,
};

export default TrajectoryAnalysisDisplaySettings;
