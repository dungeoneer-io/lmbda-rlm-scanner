const scan = require('./app');

console.log('    ____                                                      _     ');
console.log('   / __ \\__  ______  ____  ___  ____  ____  ___  ___  _____  (_)___ ');
console.log('  / / / / / / / __ \\/ __ `/ _ \\/ __ \\/ __ \\/ _ \\/ _ \\/ ___/ / / __ \\ ');
console.log(' / /_/ / /_/ / / / / /_/ /  __/ /_/ / / / /  __/  __/ /    / / /_/ /');
console.log('/_____/\\__,_/_/ /_/\\__, /\\___/\\____/_/ /_/\\___/\\___/_/ (_)/_/\\____/ ');
console.log('                  /____/               Scan to Mongo Local Utility');

const doProcess = async () => {
    
    console.log('starting.');
    // await scan({ snapshotId: '630c080dfe4dd7359414078e' });
    await scan();
    console.log('success.');
    process.exit(0);
};

doProcess();
