let token;
let blizzard;
let wowClient;
let currentPeriod;
let currentSeason;

const key = process.env.ZEPHYR_BLIZZARD_API_KEY;
const secret = process.env.ZEPHYR_BLIZARD_API_SECRET;

const updateCurrentSeason = () => blizzard.wow.mythicDungeonKeystone('season', { token })
  .then((res) => {
    currentSeason = res.data.id;
    return currentSeason;
  });

const getUserProfileIndex = async (name, rlmSlug) => blizzard.profile.mythicKeystoneProfile({ name, realm: rlmSlug, token })
  .then(({ data }) => data);

const updateCurrentPeriod = () => blizzard.wow.mythicDungeonKeystone('period', { token })
  .then(res => blizzard.wow.mythicDungeonKeystone('period', { token, id: res.data.current_period.id }))
  .then((res) => {
    currentPeriod = res.data;
    console.log('period obtained');
    return currentPeriod;
  });

const connectToBlizzard = async () => {
  wowClient = await require('blizzard.js').wow.createInstance({
    key,
    secret,
    origin: 'us'
  });
 
  console.log('Blizzard Connection Succeeded...');
};

const pluckData = ({ data }) => data;

const getWowRealm = ({ realm }) => blizzard.wow.realm({
  realm,
  token,
}).then(pluckData);

const getMythicBoard = ({ realm, dungeon, period }) => blizzard.wow.mythicKeystoneLeaderboard({
  realm,
  dungeon,
  period,
  token,
}).then(res => res.data);

const getCurrent = () => ({
  currentPeriod,
  currentSeason,
});

/* BlizzardJS v4 */
const getWowPlayableRace = (o) => wowClient.playableRace(o)
  .then(pluckData);
const getWowPlayableClass = (o) => wowClient.playableClass(o)
  .then(pluckData);
const getWowPlayableSpec = (o) => wowClient.playableSpecialization(o)
  .then(pluckData);
const getWowCrealmIndex = () => wowClient.connectedRealm()
  .then(pluckData);
const getWowConnectedRealm = ({ id }) => wowClient.connectedRealm({ id })
  .then(pluckData);
const getMythicData = (o) => wowClient.mythicKeystone(o)
  .then(pluckData);
const getMythicAffix = (o) => wowClient.mythicKeystoneAffix(o)
  .then(pluckData);


module.exports = {
  connectToBlizzard,
  getWowConnectedRealm,
  getWowCrealmIndex,
  getMythicBoard,
  getWowRealm,
  updateCurrentPeriod,
  getCurrent,
  updateCurrentSeason,
  getUserProfileIndex,
  getWowPlayableClass,
  getWowPlayableRace,
  getWowPlayableSpec,
  getMythicData,
  getMythicAffix
};
