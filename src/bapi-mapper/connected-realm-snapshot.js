const SNAPSHOT_TYPE = 'ConnectedRealmList';

const convertIndexResultsToCrlmSnapshot = (results) => ({
    stamp: Date.now(),
    type: SNAPSHOT_TYPE,
    data: results.map(mapApiToConnectedRealmData)
});

const mapApiToConnectedRealmData = ({ id, realms }) => ({
    id,
    realms: realms.map(({
        id: idx,
        region,
        name,
        category,
        locale,
        timezone,
        type,
        slug
    }) => ({
        id: idx,
        region: region.id,
        name,
        category,
        locale,
        timezone,
        type: type.type,
        slug,
        crlm: id
    }))
});

const extractAllRealmsFromCrlmSnapshot = ({ data }) => {
    const rlmMap = data.map(({ realms }) => realms);
    return rlmMap.flatMap(o => o);
};

module.exports = {
    convertIndexResultsToCrlmSnapshot,
    extractAllRealmsFromCrlmSnapshot
};
