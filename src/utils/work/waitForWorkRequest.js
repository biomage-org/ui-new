import dayjs from 'dayjs';

import { decompressUint8Array } from 'utils/work/unpackResult';
import parseResult from 'utils/work/parseResult';
import WorkTimeoutError from 'utils/errors/http/WorkTimeoutError';
import WorkResponseError from 'utils/errors/http/WorkResponseError';

import { updateBackendStatus } from 'redux/actions/backendStatus';

const timeoutIds = {};

// getRemainingWorkerStartTime returns how many more seconds the worker is expected to
// need to be running with an extra 1 minute for a bit of leeway
// const getRemainingWorkerStartTime = (creationTimestamp) => {
//   const now = new Date();
//   const creationTime = new Date(creationTimestamp);
//   const elapsed = parseInt((now - creationTime) / (1000), 10); // gives second difference

//   // we assume a worker takes up to 5 minutes to start
//   const totalStartup = 5 * 60;
//   const remainingTime = totalStartup - elapsed;
//   // add an extra minute just in case
//   return remainingTime + 60;
// };

// getTimeoutDate returns the date resulting of adding 'timeout' seconds to
// current time.
const getTimeoutDate = (timeout) => dayjs().add(timeout, 's').toISOString();

// set a timeout and save its ID in the timeoutIds map
// if there was a timeout for the current ETag, clear it before reseting it
const setOrRefreshTimeout = (request, timeoutDuration, reject, ETag) => {
  if (timeoutIds[ETag]) {
    clearTimeout(timeoutIds[ETag]);
  }

  // timeoutDate needs to be initialized outside the timeout callback
  // or it will be computed when the error is raised instead of (now)
  // when the timeout is set
  const timeoutDate = getTimeoutDate(timeoutDuration);
  timeoutIds[ETag] = setTimeout(() => {
    reject(new WorkTimeoutError(timeoutDuration, timeoutDate, request, ETag));
  }, timeoutDuration * 1000);
};

const getWorkerTimeout = (taskName, defaultTimeout) => {
  switch (taskName) {
    case 'GetEmbedding':
    case 'ListGenes':
    case 'MarkerHeatmap':
    case 'GetNormalizedExpression': {
      return dayjs().add(1800, 's').toISOString();
    }

    default: {
      return dayjs().add(defaultTimeout, 's').toISOString();
    }
  }
};

const waitForWorkRequest = async (
  ETag,
  experimentId,
  request,
  timeout,
  dispatch,
) => {
  const { default: connectionPromise } = await import('utils/socketConnection');

  const io = await connectionPromise;

  // for listGenes, markerHeatmap, & getEmbedding we set a long timeout for the worker
  // after that timeout the worker will skip those requests
  // meanwhile in the UI we set a shorter timeout. The UI will be prolonging this timeout
  // as long as it receives "heartbeats" from the worker because that means the worker is alive
  // and progresing.
  // this should be removed if we make each request run in a different worker
  const workerTimeoutDate = getWorkerTimeout(request, timeout);

  const timeoutPromise = new Promise((resolve, reject) => {
    setOrRefreshTimeout(request, timeout, reject, ETag);

    // io.on(`WorkerInfo-${experimentId}`, (res) => {
    //   const { response: { podInfo: { creationTimestamp, phase } } } = res;
    //   const extraTime = getRemainingWorkerStartTime(creationTimestamp);

    //   // this worker info indicates that the work request has been received but the worker
    //   // is still spinning up so we will add extra time to account for that.
    //   if (phase === 'Pending' && extraTime > 0) {
    //     const newTimeout = timeout + extraTime;
    //     setOrRefreshTimeout(request, newTimeout, reject, ETag);
    //   }
    // });

    // this experiment update is received whenever a worker finishes any work request
    // related to the current experiment. We extend the timeout because we know
    // the worker is alive and was working on another request of our experiment
    io.on(`Heartbeat-${experimentId}`, (message) => {
      console.log('received heartbeat:', message);
      const newTimeoutDate = getTimeoutDate(timeout);
      if (newTimeoutDate < workerTimeoutDate) {
        const status = {
          worker: {
            statusCode: message.status_code,
            userMessage: message.user_message,
          },
        };
        dispatch(updateBackendStatus(experimentId, status));

        setOrRefreshTimeout(request, timeout, reject, ETag);
      }
    });
  });

  const responsePromise = new Promise((resolve, reject) => {
    io.on(`WorkResponse-${ETag}`, async (res) => {
      console.log('received work response:', res);
      // If type is object, then we received a notification with a signedUrl
      // now we need to fetch the actual result from s3
      if (typeof res === 'object') {
        const { response } = res;

        if (response.error) {
          const { errorCode, userMessage } = response;
          console.error(errorCode, userMessage);

          return reject(
            new WorkResponseError(errorCode, userMessage, request),
          );
        }

        return resolve({ signedUrl: response.signedUrl });
      }

      // If type isn't object, then we have the actual work result,
      // no further downloads are necessary, we just need to decompress and return it
      const decompressedData = await decompressUint8Array(Uint8Array.from(Buffer.from(res, 'base64')));

      return resolve({ data: parseResult(decompressedData) });
    });
  });

  // TODO switch to using normal WorkRequest for v2 requests
  return await Promise.race([timeoutPromise, responsePromise]);
};

export default waitForWorkRequest;
