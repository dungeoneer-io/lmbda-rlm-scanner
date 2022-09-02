const axios = require('axios');

const sendDiscordNotification = async (message) => {
    if (process.env.DISCORD_NOTIFICATION_WEBHOOK) {
        const url = process.env.DISCORD_NOTIFICATION_WEBHOOK;
        await axios({ url, method: 'POST', data: { content: message } });
    } else {
        console.log('unable to send discord notification. webhook not configured.');
    }
};

module.exports = {
    sendDiscordNotification
};
