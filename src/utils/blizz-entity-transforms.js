const {
    getWowCrealmIndex,
    getWowPlayableClass,
    getWowPlayableSpec,
    getMythicData
} = require('./dio-blizz');

const mapRealmPayloadToIdArray = ({ connected_realms }) => connected_realms
    .map(({ href }) => parseInt(href.replace(/.+\/([\d]+)\?.+/, "$1")))
    .sort();

const mapRawClassArrayToPlayableClassEntities = ({ classes }) => classes
    .map(({ id }) => id)
    .sort();

const mapRawSpecsToPlayableSpecs = ({ character_specializations }) => character_specializations
    .map(({ id }) => id)
    .sort();

const getRealmList = async () => getWowCrealmIndex()
    .then(mapRealmPayloadToIdArray);

const getClassList = async () => getWowPlayableClass()
    .then(mapRawClassArrayToPlayableClassEntities);

const getSpecList = async () => getWowPlayableSpec()
    .then(mapRawSpecsToPlayableSpecs);

const getCurrentPeriod = async () => getMythicData({ resource: 'period' })
    .then(({ current_period: { id } }) => id);

module.exports = {
    getClassList,
    getRealmList,
    getSpecList,
    getCurrentPeriod
};
