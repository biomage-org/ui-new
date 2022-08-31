import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Space, Button,
} from 'antd';
import integrationTestConstants from 'utils/integrationTestConstants';
import { process10XUpload, processSeuratUpload } from 'utils/upload/processUpload';
import DownloadDataButton from './DownloadDataButton';
import LaunchAnalysisButton from './LaunchAnalysisButton';
import FileUploadModal from './FileUploadModal';
import ShareExperimentModal from './ShareExperimentModal';

const ProjectMenu = () => {
  const dispatch = useDispatch();
  const samples = useSelector((state) => state.samples);
  const activeExperimentId = useSelector((state) => state.experiments.meta.activeExperimentId);
  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [shareExperimentModalVisible, setShareExperimentModalVisible] = useState(false);

  const uploadFiles = (filesList, sampleType) => {
    if (sampleType === '10X Chromium') {
      process10XUpload(filesList, sampleType, samples, activeExperimentId, dispatch);
    } else if (sampleType == 'Seurat') {
      processSeuratUpload(filesList, sampleType, samples, activeExperimentId, dispatch);
    }
    setUploadModalVisible(false);
  };

  return (
    <>
      <Space>
        <Button
          data-test-id={integrationTestConstants.ids.ADD_SAMPLES_BUTTON}
          onClick={() => setUploadModalVisible(true)}
        >
          Add data
        </Button>
        <DownloadDataButton />
        <Button
          onClick={() => setShareExperimentModalVisible(!shareExperimentModalVisible)}
        >
          Share
        </Button>

        {shareExperimentModalVisible && (
          <ShareExperimentModal
            onCancel={() => setShareExperimentModalVisible(false)}
            experiment={activeExperiment}
          />
        )}
        <LaunchAnalysisButton />
      </Space>
      {uploadModalVisible ? (
        <FileUploadModal
          onUpload={uploadFiles}
          onCancel={() => setUploadModalVisible(false)}
        />
      ) : <></>}
    </>
  );
};
export default ProjectMenu;
