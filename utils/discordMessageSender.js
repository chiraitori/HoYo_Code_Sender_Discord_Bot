const { Routes } = require('discord.js');
const { broadcastEvalWhenReady } = require('./clusterGuilds');

function serializeAllowedMentions(allowedMentions = {}) {
    return {
        parse: [],
        roles: allowedMentions.roles || [],
        users: allowedMentions.users || [],
        replied_user: false
    };
}

function serializeMessagePayload(payload) {
    return {
        content: payload.content || '',
        embeds: (payload.embeds || []).map(embed =>
            typeof embed.toJSON === 'function' ? embed.toJSON() : embed
        ),
        allowedMentions: payload.allowedMentions || { roles: [], users: [] }
    };
}

async function sendChannelMessage(client, channelId, payload) {
    const cachedChannel = client.channels.cache.get(channelId);
    if (cachedChannel && typeof cachedChannel.send === 'function') {
        await cachedChannel.send(payload);
        return true;
    }

    if (client.shard?.broadcastEval) {
        const shardResults = await broadcastEvalWhenReady(
            client,
            async (shardClient, context) => {
                const channel = shardClient.channels.cache.get(context.channelId);
                if (!channel) {
                    return { handled: false, sent: false };
                }

                if (typeof channel.send !== 'function') {
                    return {
                        handled: true,
                        sent: false,
                        error: 'Channel is not sendable'
                    };
                }

                try {
                    await channel.send(context.payload);
                    return { handled: true, sent: true };
                } catch (error) {
                    return {
                        handled: true,
                        sent: false,
                        error: error.message,
                        code: error.code || null
                    };
                }
            },
            {
                context: {
                    channelId,
                    payload: serializeMessagePayload(payload)
                }
            }
        );

        const owningShardResult = shardResults.find(result => result?.handled);
        if (owningShardResult?.sent) {
            return true;
        }
        if (owningShardResult) {
            const error = new Error(
                owningShardResult.error || 'The owning shard could not send the message'
            );
            if (owningShardResult.code) {
                error.code = owningShardResult.code;
            }
            throw error;
        }
    }

    await client.rest.post(Routes.channelMessages(channelId), {
        body: {
            content: serializeMessagePayload(payload).content,
            embeds: serializeMessagePayload(payload).embeds,
            allowed_mentions: serializeAllowedMentions(payload.allowedMentions)
        }
    });
    return true;
}

module.exports = {
    sendChannelMessage,
    serializeMessagePayload
};
