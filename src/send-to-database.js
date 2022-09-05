const { getDb } = require('./utils/dio-mongo');
const {
    COLLECTIONS,
    DATABASES,
    BEE_TYPES
} = require('./entity-enums');
const { extractAllRealmsFromCrlmSnapshot } = require('./bapi-mapper/connected-realm-snapshot');

const sendToDatabase = async (snapshot) => {
    console.log('transmitting unique crealms...');
    await upsertCrealmEntitiesFromSnapshot(snapshot);
    console.log('transmitting unique realms...');
    await upsertRealmEntitiesFromSnapshot(snapshot);
};

const upsertCrealmEntitiesFromSnapshot = async (snapshot) => {
    const crealms = snapshot.data;
    const crealmColl = await getDb()
        .db(DATABASES.DEFAULT)
        .collection(COLLECTIONS.BE_CREALM);
    const batch = crealmColl.initializeUnorderedBulkOp();
    
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

    const beeIds = upserted.map(({ _id }) => _id);
    await insertBlizzardEntityEventArray(
        beeIds,
        BEE_TYPES.CREALM
    );
};

const upsertRealmEntitiesFromSnapshot = async (snapshot) => {
    const realms = extractAllRealmsFromCrlmSnapshot(snapshot);
    const realmColl = await getDb()
        .db(DATABASES.DEFAULT)
        .collection(COLLECTIONS.BE_REALM);
    const batch = realmColl.initializeUnorderedBulkOp();

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
    const results = await batch.execute();

    const { nUpserted, upserted } = results.result;
    if (nUpserted === 0) return;

    const beeIds = upserted.map(({ _id }) => _id);
    await insertBlizzardEntityEventArray(
        beeIds,
        BEE_TYPES.REALM
    );
};

const insertBlizzardEntityEventArray = async (idArray, type, event = 'ADDED') => {
    console.log(`transmitting ${idArray.length} identified entity events..`);
    const eventColl = await getDb()
        .db(DATABASES.DEFAULT)
        .collection(COLLECTIONS.BLIZZARDENTITYEVENTS);

    await eventColl.insertMany(
        idArray.map((o) => ({
            stamp: Date.now(),
            entity: {
                id: o,
                type
            },
            event
        }))
    );
};

module.exports = sendToDatabase;
