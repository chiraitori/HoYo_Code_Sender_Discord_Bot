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

async function sendChannelMessage(client, channelId, payload, options = {}) {
    const cachedChannel = client.channels.cache.get(channelId);
    if (cachedChannel && typeof cachedChannel.send === 'function') {
        const message = await cachedChannel.send(payload);
        return options.returnMessageId ? message.id : true;
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
                    const message = await channel.send(context.payload);
                    return { handled: true, sent: true, messageId: message?.id };
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
            return options.returnMessageId ? owningShardResult.messageId : true;
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

    const message = await client.rest.post(Routes.channelMessages(channelId), {
        body: {
            content: serializeMessagePayload(payload).content,
            embeds: serializeMessagePayload(payload).embeds,
            allowed_mentions: serializeAllowedMentions(payload.allowedMentions)
        }
    });
    return options.returnMessageId ? message.id : true;
}

async function editChannelMessage(client, channelId, messageId, payload) {
    await client.rest.patch(Routes.channelMessage(channelId, messageId), {
        body: {
            embeds: serializeMessagePayload(payload).embeds,
            allowed_mentions: { parse: [], roles: [], users: [], replied_user: false }
        }
    });
    return true;
}

module.exports = {
    sendChannelMessage,
    editChannelMessage,
    serializeMessagePayload
};
