const cliProgress = require('cli-progress');
const Stopwatch = require('statman-stopwatch');
const { waitMs } = require('./await-half-hour');

const queueUntilResolved = async (promiseFn, paramArr, maxConcurrent, maxRetry, options = { showBar: true, debug: false }) => {
  const { showBar, debug } = options;
  const timer = new Stopwatch(true);
  const results = [];
  let requestList = paramArr;
  let abortedCount = 0;
  let checkoutList = {};
  let checkins = 0;
  const killedList = [];
  const now = new Date();
  let statusbar;
  if (showBar) {
    statusbar = new cliProgress.Bar({
      format: '{startTime} [{bar}] {percentage}% ({value}/{total}) | duration {duration}s +ETA~{eta}s | requeues {errorCount} | running: {runnerCount} | killed: {killedCount}',
      etaBuffer: 50,
    }, cliProgress.Presets.shades_classic);
    statusbar.start(paramArr.length, 0, {
      startTime: `${now.getHours()}:${now.getMinutes()}`,
      killedCount: 0,
      errorCount: 0,
      runnerCount: 0,
    });
  }

  const endProcess = () => {
    abandonedList = [...requestList];
    abortedCount = requestList.length;
    requestList = [];
    if (showBar) {
      statusbar.stop();
    }
    timer.stop();
  };

  const checkComplete = () => {
    if (requestList.length === 0 && (!showBar || statusbar.payload.runnerCount === 0)) {
      endProcess();
    }
  };

  const attemptResolveNext = (id) => {
    checkins += 1;
    if (requestList.length === 0) {
      checkComplete();
      return Promise.resolve();
    }
    if (showBar) {
      statusbar.update(statusbar.value, {
        killedCount: statusbar.payload.killedCount,
        errorCount: statusbar.payload.errorCount,
        runnerCount: statusbar.payload.runnerCount + 1,
      });
    }
    const nextItem = requestList.pop();
    checkoutList[id] = nextItem;
    return promiseFn(nextItem)
      .then(r => handleSuccessfulCall(r, id)) // eslint-disable-line
      .catch(e => handleFailedCall(e, id)); // eslint-disable-line
  };

  const handleSuccessfulCall = (result, id) => {
    results.push(result);
    if (showBar) {
      statusbar.update(statusbar.value + 1, {
        killedCount: statusbar.payload.killedCount,
        errorCount: statusbar.payload.errorCount,
        runnerCount: statusbar.payload.runnerCount - 1,
      });
    }
    checkoutList[id] = undefined;
    return attemptResolveNext(id);
  };

  const handleFailedCall = (e, id) => {
    const failedRequest = { ...checkoutList[id] }; // eslint-disable-line
    if (debug) {
      console.log(e.message, failedRequest.crealmId + '-' + failedRequest.dungeon);
    }
    failedRequest.poisonCount = failedRequest.poisonCount ? failedRequest.poisonCount + 1 : 1;

    const killingThisRequest = failedRequest.poisonCount > maxRetry;

    if (showBar) {
      statusbar.update(statusbar.value + (killingThisRequest ? 1 : 0), {
        killedCount: statusbar.payload.killedCount + (killingThisRequest ? 1 : 0),
        errorCount: statusbar.payload.errorCount + 1,
        runnerCount: statusbar.payload.runnerCount - 1,
      });
    }
    const destinationList = killingThisRequest ? killedList : requestList;
    destinationList.push(failedRequest);
    checkoutList[id] = undefined;
    return attemptResolveNext(id);
  };

  const promiseWorkers = [];
  for (let i = 0; i < maxConcurrent; i += 1) {
    promiseWorkers.push(attemptResolveNext(i));
    await waitMs(80); // eslint-disable-line
  }

  return Promise.all(promiseWorkers)
    .then(() => ({
      killedList,
      abandonedList: checkoutList,
      abandonedCount: showBar ? statusbar.payload.runnerCount : 0,
      abortedCount,
      retryCount: showBar ? statusbar.payload.errorCount : 0,
      entryCount: showBar ? statusbar.value : 0,
      duration: timer.read(),
      results,
    }))
    .catch((e) => console.log('so...caught an exception in P.all', e));
};

module.exports = queueUntilResolved;
