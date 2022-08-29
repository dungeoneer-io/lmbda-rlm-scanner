const scan = require('./src/app');

exports.handler = async (e) => {
    const p = await scan(e);
    const response = {
        statusCode: 200,
        body: JSON.stringify(p)
    };

    return response;
};
