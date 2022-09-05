const { ObjectId } = require('mongodb');
const {
    getWowConnectedRealm,
    queueUntilResolved,
    getRealmList,
    getDb
} = require('@dungeoneer-io/nodejs-utils');

const {
    convertIndexResultsToCrlmSnapshot
} = require('./bapi-mapper/connected-realm-snapshot');

const {
    COLLECTIONS,
    DATABASES
} = require('./entity-enums');

const getSnapshot = async ({ snapshotId }) => {
    let crealmSnapshot;
    if (!snapshotId) {
        crealmSnapshot = await procureLiveCrealmSnapshot();
    } else {
        crealmSnapshot = await fetchSnapshotById(snapshotId);
    }

    return crealmSnapshot;
};

const procureLiveCrealmSnapshot = async () => {
    let realmList = await getRealmList();
    const itemsToProcess = realmList.map((o) => ({ id: o }));
   
    const snapshotCollection = await getDb()
        .db(DATABASES.DEFAULT)
        .collection(COLLECTIONS.SNAPSHOTS);

    let results = await queueUntilResolved(
        getWowConnectedRealm,
        itemsToProcess,
        15,
        3,
        { showBar: true, debug: true }
    )
    .catch(o => console.log('uncaught exception deep within QUR'));

    const crealmSnapshot = convertIndexResultsToCrlmSnapshot(results.results);
    await snapshotCollection.insertOne(crealmSnapshot);

    return crealmSnapshot;
};

const fetchSnapshotById = async (snapshotId) => {
    const snapshotCollection = await getDb()
        .db(DATABASES.DEFAULT)
        .collection(COLLECTIONS.SNAPSHOTS);

    console.log('transmitting crealm snapshot...')(`retrieving snapshot id ${ snapshotId }`);
    const snapshot = await snapshotCollection.findOne({ _id: new ObjectId(snapshotId) });

    return snapshot;
};

module.exports = getSnapshot;
