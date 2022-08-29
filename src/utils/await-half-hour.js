const waitMs = async msToNext => new Promise((resolve) => {
  setTimeout(() => { resolve('done!'); }, msToNext);
});

const waitMsFor = async (msToNext, func) => new Promise(() => {
  setTimeout(() => { func(); }, msToNext);
});

const msToNextHalfHour = () => {
  const a = new Date();
  const min = Math.ceil((a.getMinutes() + 1) / 30) * 30;
  const b = new Date();
  b.setMinutes(min + 5);
  b.setSeconds(0);
  b.setMilliseconds(0);
  const msToNext = b.getTime() - a.getTime();
  return msToNext;
};

const waitUntilNextHalfHour = async () => waitMs(msToNextHalfHour());

module.exports = { waitUntilNextHalfHour, waitMs, waitMsFor };
