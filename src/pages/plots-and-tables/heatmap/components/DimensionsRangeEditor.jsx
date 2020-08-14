import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
} from 'antd';


const DimensionsRangeEditor = (props) => {
  const { onUpdate } = props;

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Dimensions</div>

        <Form.Item
          label='Width'
        >
          <Slider
            defaultValue={500}
            min={400}
            max={1200}
            onAfterChange={(value) => {
              onUpdate({ width: value });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Height'
        >
          <Slider
            defaultValue={500}
            min={200}
            max={1000}
            onAfterChange={(value) => {
              onUpdate({ height: value });
            }}
          />
        </Form.Item>
      </Form>
    </>
  );
};

DimensionsRangeEditor.propTypes = {
  onUpdate: PropTypes.func.isRequired,
};

export default DimensionsRangeEditor;
