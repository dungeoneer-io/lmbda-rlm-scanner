const scan = require('./src/app');

exports.handler = async () => {
    const p = await scan();
    const response = {
        statusCode: 200,
        body: JSON.stringify(p);
    };

    return response;
};
