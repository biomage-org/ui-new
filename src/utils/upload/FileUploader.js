import _ from 'lodash';

import { AsyncGzip } from 'fflate';
import filereaderStream from 'filereader-stream';

import putPartInS3 from './putPartInS3';
import UploadStatus from './UploadStatus';

class FileUploader {
  constructor(
    file,
    compress,
    chunkSize,
    uploadParams,
    abortController,
    onStatusUpdate,
  ) {
    if (!file
      || !chunkSize
      || !uploadParams
      || !abortController
      || !onStatusUpdate
    ) {
      throw new Error('FileUploader: Missing required parameters');
    }

    this.file = file;
    this.compress = compress;
    this.chunkSize = chunkSize;
    this.uploadParams = uploadParams;

    // Upload related callbacks and handling
    this.onStatusUpdate = onStatusUpdate;
    this.abortController = abortController;

    // Stream handling
    this.totalChunks = Math.ceil(file.size / chunkSize);
    this.pendingChunks = this.totalChunks;

    // This is necessary to connect the streams between read and compress.
    // They handle stream ends in different ways
    this.previousReadChunk = null;

    // Used to assign partNumbers to each chunk
    this.partNumberIt = 0;

    this.readStream = null;
    this.gzipStream = null;

    this.uploadedParts = [];

    this.resolve = null;
    this.reject = null;

    // To track upload progress
    this.uploadedPartPercentages = new Array(this.totalChunks).fill(0);
  }

  async upload() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;

      this.readStream = filereaderStream(
        this.file?.fileObject || this.file, { chunkSize: this.chunkSize },
      );

      this.#setupReadStreamHandlers();

      if (this.compress) {
        this.gzipStream = new AsyncGzip({ level: 1, consume: false });
        this.#setupGzipStreamHandlers();
      }
    });
  }

  #uploadChunk = async (compressedPart, partNumber) => {
    const partResponse = await putPartInS3(
      compressedPart,
      this.uploadParams,
      partNumber,
      this.abortController,
      this.#createOnUploadProgress(partNumber),
    );

    this.uploadedParts.push({ ETag: partResponse.headers.etag, PartNumber: partNumber });
  }

  #createOnUploadProgress = (partNumber) => (progress) => {
    // partNumbers are 1-indexed, so we need to subtract 1 for the array index
    this.uploadedPartPercentages[partNumber - 1] = progress.progress;

    const percentage = _.mean(this.uploadedPartPercentages) * 100;
    this.onStatusUpdate(UploadStatus.UPLOADING, Math.floor(percentage));
  };

  #setupGzipStreamHandlers = () => {
    this.gzipStream.ondata = async (err, chunk) => {
      try {
        if (err) throw new Error(err);

        await this.#handleChunkReadFinished(chunk);
      } catch (e) {
        this.#cancelExecution(UploadStatus.FILE_READ_ERROR, e);
      }
    };
  }

  #setupReadStreamHandlers = () => {
    this.readStream.on('data', async (chunk) => {
      try {
        if (!this.compress) {
          await this.#handleChunkReadFinished(chunk);
          return;
        }

        if (this.previousReadChunk !== null) this.gzipStream.push(this.previousReadChunk);

        this.previousReadChunk = chunk;
      } catch (e) {
        this.#cancelExecution(UploadStatus.FILE_READ_ERROR, e);
      }
    });

    this.readStream.on('error', (e) => {
      this.#cancelExecution(UploadStatus.FILE_READ_ERROR, e);
    });

    this.readStream.on('end', () => {
      try {
        if (!this.compress) return;

        this.gzipStream.push(this.previousReadChunk, true);
      } catch (e) {
        this.#cancelExecution(UploadStatus.FILE_READ_ERROR, e);
      }
    });
  }

  #cancelExecution = (status, e) => {
    this.readStream.destroy();
    this.gzipStream.terminate();
    // eslint-disable-next-line no-unused-expressions
    this.abortController?.abort();

    this.onStatusUpdate(status);

    this.reject(e);
    console.error(e);
  }

  #handleChunkReadFinished = async (chunk) => {
    this.partNumberIt += 1;

    try {
      await this.#uploadChunk(chunk, this.partNumberIt);
    } catch (e) {
      this.#cancelExecution(UploadStatus.UPLOAD_ERROR, e);
    }

    this.pendingChunks -= 1;

    if (this.pendingChunks === 0) {
      this.resolve(this.uploadedParts);
    }
  }
}

export default FileUploader;
