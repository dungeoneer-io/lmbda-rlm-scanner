const axios = require('axios');

const sendDiscordNotification = async (message) => {
    if (process.env.DISCORD_NOTIFICATION_WEBHOOK) {
        const url = process.env.DISCORD_NOTIFICATION_WEBHOOK;
        await axios({ url, method: 'POST', data: { content: message } });
    } else {
        console.log('unable to send discord notification. webhook not configured.');
    }
};

const getLamdaInfoStringFromContext = (context) => {
    if (!context) { return ''; }
    const {
        functionName,
        functionVersion,
        invokedFunctionArn,
        awsRequestId
    } = context;

    return `:anger: ${functionName}@v${functionVersion}\nARN: \`${invokedFunctionArn}\`\nAWS Request ID: \`${awsRequestId}\``;
};

const lambdaTry200Catch500 = async ({
    context,
    event,
    fn200 = async () => {},
    fn500 = async () => {},
    notifyOn200 = false,
    notifyOn500 = true
}) => {
    const lambdaInfo = getLamdaInfoStringFromContext(context);
    try {
        await fn200(event);

        if (context && notifyOn200) {
            await sendDiscordNotification(`:green_circle: **lmda-mythic-enum-scanner** successful lambda run\n${lambdaInfo}`);
        }
        return {
            statusCode: 200,
            body: 'OK'
        };
    } catch (e) {
        fn500(e, event);
        if (context && notifyOn500) {
            await sendDiscordNotification(`:red_circle: **lmda-mythic-enum-scanner** responding 500\n\`\`\`\n${e.message}\n\`\`\`\n${lambdaInfo}`);
        }
        return {
            statusCode: 500,
            body: 'FAILED'
        }
    }
};

module.exports = {
    getLamdaInfoStringFromContext,
    lambdaTry200Catch500,
    sendDiscordNotification
};
