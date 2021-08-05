//@ts-check

/**
 * Helper function to find a channel the bot can send a message in
 * @param {import('discord.js').Guild} guild 
 * @return {import('discord.js').TextChannel}
 */
const getDefaultChannel = (guild) => {
    let channel;
    // Get "original" default channel
    if (guild.channels.cache.has(guild.id)) {
        channel = guild.channels.cache.get(guild.id)
        if (channel.permissionsFor(guild.client.user).has("SEND_MESSAGES")) {
            //@ts-ignore
            return guild.channels.cache.get(guild.id)
        }
    }

    // Check for a "general" channel, which is often default chat
    channel = guild.channels.cache.find(channel => channel.name === "general" && channel.permissionsFor(guild.client.user).has("SEND_MESSAGES") && channel.type === "GUILD_TEXT");
    //@ts-ignore
    if (channel) return channel;

    // Now we get into the heavy stuff: first channel in order where the bot can speak
    //@ts-ignore
    return guild.channels.cache
        .filter(c => c.type === "GUILD_TEXT" && !c.isThread &&
                     c.permissionsFor(guild.client.user).has("SEND_MESSAGES"))
        //@ts-ignore
        .sort((a, b) => a.position - b.position)
        .first();
}

/**
 * @param {import('../../util/client')} client 
 * @param {import('discord.js').Guild} guild 
 */
module.exports = async (client, guild) => {
    try {
        if (guild.available) {
            const channel = getDefaultChannel(guild);
            if (!channel) return;
    
            await channel.send(`Thanks for adding me! My prefix is \`${client.config.PREFIX}\`\nFor a list of commands, type \`${client.config.PREFIX}help\``);
        }
    } catch (e) {
        client.utils.log("ERROR", "src/events/guild/guildCreate.js", e.message);
    }
}
