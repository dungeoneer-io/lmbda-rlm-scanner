const { connectToBlizzard } = require('./utils/dio-blizz');
const { initDb } = require('./utils/dio-mongo');
const { lambdaTry200Catch500 } = require('./utils/dio-util');
const getSnapshot = require('./get-snapshot');
const sendToDatabase = require('./send-to-database');

const harvestAndUpsertRlmData = async (lambdaEvent) => {
    await initDb();
    await connectToBlizzard();

    const snapshot = await getSnapshot(lambdaEvent);
    await sendToDatabase(snapshot);

    return snapshot;
};

exports.handler = async (event = {}, context) => {
    console.log('Dungeoneer.io');
    console.log('lmda-run-scanner');
    console.log('================');

    await lambdaTry200Catch500({
        context,
        event,
        notifyOn200: true,
        fn200: harvestAndUpsertRlmData,
        fn500: (e) => console.log('error', e)
    });
};
