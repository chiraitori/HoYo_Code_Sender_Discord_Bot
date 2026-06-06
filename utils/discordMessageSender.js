const { Routes } = require('discord.js');

function serializeAllowedMentions(allowedMentions = {}) {
    return {
        parse: [],
        roles: allowedMentions.roles || [],
        users: allowedMentions.users || [],
        replied_user: false
    };
}

async function sendChannelMessage(client, channelId, payload) {
    const cachedChannel = client.channels.cache.get(channelId);
    if (cachedChannel && typeof cachedChannel.send === 'function') {
        await cachedChannel.send(payload);
        return true;
    }

    await client.rest.post(Routes.channelMessages(channelId), {
        body: {
            content: payload.content || '',
            embeds: (payload.embeds || []).map(embed =>
                typeof embed.toJSON === 'function' ? embed.toJSON() : embed
            ),
            allowed_mentions: serializeAllowedMentions(payload.allowedMentions)
        }
    });
    return true;
}

module.exports = {
    sendChannelMessage
};
