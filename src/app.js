const Stopwatch = require('statman-stopwatch');
const { connectToBlizzard, getWowConnectedRealm } = require('./utils/dio-blizz');
const { getDb, initDb } = require('./utils/dio-mongo');
const queueUntilResolved = require('./utils/queue-until-resolved');
const { getRealmList } = require('./utils/blizz-entity-transforms');
const {
    convertIndexResultsToCrlmSnapshot,
    extractAllRealmsFromCrlmSnapshot
} = require('./bapi-mapper/connected-realm-snapshot');

const debugging = true;
const debugLog = (log) => debugging && console.log(log);
const MONGO_DB_NAME = 'US';
const COLLECTION_NAMES = {
    SNAPSHOTS: 'snapshots',
    BLIZZARDENTITYEVENTS: 'BlizzEntityEvents',
    BE_CREALM: 'Crealms',
    BE_REALM: 'Realms',
    ZEPHYR_LOGS: 'ZephyrEvents'
};

const doScanProcess = async (getLiveSnapshot = true) => {
    await initDb();
    debugLog('Dungeoneer.io Scrape CREALM INFO');
    await connectToBlizzard();
    
    let crealmSnapshot;
    if (getLiveSnapshot) {
        crealmSnapshot = await procureLiveCrealmSnapshot();
    } else {
        crealmSnapshot = {}; //stub for later
    }

    await upsertCrealmEntitiesFromSnapshot(crealmSnapshot);
    await upsertRealmEntitiesFromSnapshot(crealmSnapshot);
    /*      Still need to find entity events, somehow?       */
    return 'OK';
};

const insertBlizzardEntityEventArray = async (entityArray, event = 'ADDED') => {
    const eventColl = await getDb()
        .db(MONGO_DB_NAME)
        .collection(COLLECTION_NAMES.BLIZZARDENTITYEVENTS);

    await eventColl.insertMany(
        entityArray.map((o) => ({
            stamp: Date.now(),
            entity: o,
            event
        }))
    );
};


const upsertCrealmEntitiesFromSnapshot = async (snapshot) => {
    const crealms = snapshot.data;
    const crealmColl = await getDb()
        .db(MONGO_DB_NAME)
        .collection(COLLECTION_NAMES.BE_CREALM);
    const batch = crealmColl.initializeUnorderedBulkOp();
    debugLog('transmitting unique crealms...');
    crealms.forEach(({ id, realms }) => {
        batch.find({ _id: `${id}` })
            .upsert()
            .updateOne({
                $setOnInsert: {
                    first: Date.now()
                },
                $set: {
                    last: Date.now(),
                    realms
                }
            });
    });
    const results = await batch.execute();

    const { nUpserted, upserted } = results.result;
    if (nUpserted === 0) return;

    const blizzardEntities = upserted.map(({ _id }) => ({
        id: _id,
        type: 'CREALM'
    }));
    debugLog(`transmitting ${ nUpserted } entity events...`);
    await insertBlizzardEntityEventArray(blizzardEntities);
};

const upsertRealmEntitiesFromSnapshot = async (snapshot) => {
    const realms = extractAllRealmsFromCrlmSnapshot(snapshot);
    const realmColl = await getDb()
        .db(MONGO_DB_NAME)
        .collection(COLLECTION_NAMES.BE_REALM);
    const batch = realmColl.initializeUnorderedBulkOp();
    debugLog('transmitting unique realms...');
    realms.forEach(({ id, crlm, ...rest }) => {
        batch.find({ _id: `${id}` })
            .upsert()
            .updateOne({
                $setOnInsert: {
                    first: Date.now(),
                    ...rest
                },
                $set: {
                    last: Date.now(),
                    crlm
                }
            });
    });
    await batch.execute();    
};

const procureLiveCrealmSnapshot = async () => {
    const stopwatch = new Stopwatch(true);

    let realmList = await getRealmList();
    const itemsToProcess = realmList.map((o) => ({ id: o }));
   
    const snapshotCollection = await getDb()
        .db(MONGO_DB_NAME)
        .collection(COLLECTION_NAMES.SNAPSHOTS);
    const receiptCollection = await getDb()
        .db(MONGO_DB_NAME)
        .collection(COLLECTION_NAMES.ZEPHYR_LOGS);

    let results = await queueUntilResolved(
        getWowConnectedRealm,
        itemsToProcess,
        15,
        3,
        { showBar: true, debug: true }
    )
    .catch(o => console.log('uncaught exception deep within QUR'));

    debugLog(`got results ${results.results.length}`);

    const crealmSnapshot = convertIndexResultsToCrlmSnapshot(results.results);

    debugLog('transmitting crealm snapshot...')
    const insertedSnapshot = await snapshotCollection
        .insertOne(crealmSnapshot);

    const { insertedId } = insertedSnapshot;

    await receiptCollection.insertOne({
        stamp: Date.now(),
        runtime: stopwatch.read(),
        type: 'ScanAll',
        entity: 'ConnectedRealm',
        snapshot: `${insertedId}`
    });

    return crealmSnapshot;
};




module.exports = doScanProcess;