import React from 'react';
import PropTypes from 'prop-types';
import {
  Form, Space,
} from 'antd';
import SliderWithInput from 'components/SliderWithInput';

const DisplayLabels = (props) => {
  const {
    config, onUpdate, min, max,
  } = props;

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <Form
        size='middle'
        labelCol={{ span: 10 }}
        wrapperCol={{ span: 14 }}
      >
        <p><strong>Display Gene Labels Above (-log10 pvalue)</strong></p>

        <Form.Item
          label='Min. -log10 pvalue'
        >
          <SliderWithInput
            data-testid='thresholdInput'
            value={config.textThresholdValue}
            min={min}
            max={max}
            onUpdate={(value) => {
              onUpdate({ textThresholdValue: value });
            }}
          />
        </Form.Item>
      </Form>
    </Space>
  );
};

DisplayLabels.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
};

export default DisplayLabels;
