const crypto = require('crypto');
const { Routes, ShardClientUtil } = require('discord.js');
const { waitForShardsReady } = require('./clusterGuilds');

const DISCORD_NONCE_MAX_LENGTH = 25;

function createMessageNonce(dedupeKey = null) {
    if (typeof dedupeKey === 'string' && dedupeKey.trim().length > 0) {
        return crypto
            .createHash('sha256')
            .update(dedupeKey.trim())
            .digest('hex')
            .slice(0, DISCORD_NONCE_MAX_LENGTH);
    }

    return crypto
        .randomBytes(12)
        .toString('hex')
        .slice(0, DISCORD_NONCE_MAX_LENGTH);
}

function resolveMessageNonce(payload, options = {}) {
    const rawNonce = options.nonce ?? payload?.nonce;
    if (typeof rawNonce === 'string' && rawNonce.trim().length > 0) {
        return rawNonce.trim().slice(0, DISCORD_NONCE_MAX_LENGTH);
    }
    if (Number.isInteger(rawNonce)) {
        return String(rawNonce).slice(0, DISCORD_NONCE_MAX_LENGTH);
    }

    return createMessageNonce(options.dedupeKey || null);
}

function serializeAllowedMentions(allowedMentions = {}) {
    return {
        parse: [],
        roles: allowedMentions.roles || [],
        users: allowedMentions.users || [],
        replied_user: false
    };
}

function serializeMessagePayload(payload, nonce = null) {
    const serialized = {
        content: payload.content || '',
        embeds: (payload.embeds || []).map(embed =>
            typeof embed.toJSON === 'function' ? embed.toJSON() : embed
        ),
        allowedMentions: payload.allowedMentions || { roles: [], users: [] }
    };

    if (nonce) {
        serialized.nonce = nonce;
        serialized.enforceNonce = true;
    }

    return serialized;
}

async function sendChannelMessage(client, channelId, payload, options = {}) {
    const nonce = resolveMessageNonce(payload, options);
    const cachedChannel = client.channels?.cache?.get(channelId);
    if (cachedChannel && typeof cachedChannel.send === 'function') {
        const message = await cachedChannel.send({
            ...payload,
            nonce,
            enforceNonce: true
        });
        return options.returnMessageId ? message.id : true;
    }

    if (!options.preferRest && client.shard?.broadcastEval) {
        // Wait for shard readiness BEFORE invoking a write eval, and NEVER retry
        // the write broadcastEval itself to avoid duplicate sends if another shard flaps.
        await waitForShardsReady(client);

        const shardCount = Number(client.shard.count);
        let targetShard;
        if (
            options.guildId
            && /^\d{17,20}$/.test(String(options.guildId))
            && Number.isInteger(shardCount)
            && shardCount > 1
        ) {
            targetShard = ShardClientUtil.shardIdForGuildId(String(options.guildId), shardCount);
        }

        const evalOptions = {
            context: {
                channelId,
                payload: serializeMessagePayload(payload, nonce)
            },
            ...(targetShard !== undefined ? { shard: targetShard } : {})
        };

        const rawResults = await client.shard.broadcastEval(
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
            evalOptions
        );

        const shardResults = Array.isArray(rawResults) ? rawResults : [rawResults];
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

    const serialized = serializeMessagePayload(payload, nonce);
    const message = await client.rest.post(Routes.channelMessages(channelId), {
        body: {
            content: serialized.content,
            embeds: serialized.embeds,
            allowed_mentions: serializeAllowedMentions(payload.allowedMentions),
            nonce,
            enforce_nonce: true
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
    createMessageNonce,
    sendChannelMessage,
    editChannelMessage,
    serializeMessagePayload
};
