//@ts-check

/**
 * Function to check if the user has passed in the proper arguments when using a command
 * @param {import('../src/util/client')} client 
 * @param {import('discord.js').Message} message - The message to check the arguments for
 * @param {string[]} msgArgs - The arguments given by the user
 * @param {Arguments} expectedArgs - The expected arguments for the command
 * @returns {Flags} Returns the arguments mapped by their ID's if all the arguments were as expected, else, returns `undefined/false`
 */
function processArguments(client, message, msgArgs, expectedArgs) {
    let counter = 0;
    let amount, num, role, member, channel, attach;
    let flags = {  };

    for (const argument of expectedArgs) {
        //@ts-ignore
        amount = (argument.amount && argument.amount > 1) ? argument.amount : 1;

        for (let i = 0; i < amount; i++) {
            if (!msgArgs[counter] && argument.type !== "ATTACHMENT") {
                //@ts-ignore
                if (argument.optional) return flags;
                //@ts-ignore
                return { invalid: true, prompt: argument.prompt };
            }

            switch (argument.type) {
                case "SOMETHING":
                    if (argument.words && !argument.words.includes(msgArgs[counter].toLowerCase())) return { invalid: true, prompt: argument.prompt };
                    else if (argument.regexp && !argument.regexp.test(msgArgs[counter])) return { invalid: true, prompt: argument.prompt };

                    if (amount == 1) flags[argument.id] = msgArgs[counter];
                    else if (flags[argument.id]) flags[argument.id].push(msgArgs[counter]);
                    else flags[argument.id] = [msgArgs[counter]];
                    break;

                case "NUMBER":
                    num = Number(msgArgs[counter]);
                    if (isNaN(num)) return { invalid: true, prompt: argument.prompt };
                    
                    if (argument.min && argument.min > num) return { invalid: true, prompt: argument.prompt };

                    if (argument.max && argument.max < num) return { invalid: true, prompt: argument.prompt };

                    //@ts-ignore
                    if (argument.toInteger) num = parseInt(num);

                    if (amount == 1) flags[argument.id] = num;
                    else if (flags[argument.id]) flags[argument.id].push(num);
                    else flags[argument.id] = [num];
                    break;

                case "CHANNEL":
                    if (msgArgs[counter].startsWith("<#") && msgArgs[counter].endsWith(">")) channel = message.guild.channels.cache.get(msgArgs[counter].slice(2, -1));
                    else channel = message.guild.channels.cache.get(msgArgs[counter]);

                    if (!channel) return { invalid: true, prompt: argument.prompt };

                    if (argument.channelTypes && !argument.channelTypes.includes(channel.type)) return { invalid: true, prompt: argument.prompt };

                    if (amount == 1) flags[argument.id] = channel;
                    else if (flags[argument.id]) flags[argument.id].push(channel);
                    else flags[argument.id] = [channel];
                    break;

                case "ROLE":
                    if (msgArgs[counter].startsWith("<@&") && msgArgs[counter].endsWith(">")) role = message.guild.roles.cache.get(msgArgs[counter].slice(3, -1));
                    else role = message.guild.roles.cache.get(msgArgs[counter]);

                    if (!role) return { invalid: true, prompt: argument.prompt };

                    if (argument.notBot && role.managed) return { invalid: true, prompt: argument.prompt };

                    if (amount == 1) flags[argument.id] = role;
                    else if (flags[argument.id]) flags[argument.id].push(role);
                    else flags[argument.id] = [role];
                    break;

                case "AUTHOR_OR_MEMBER":
                    if (msgArgs[counter] && (msgArgs[counter].startsWith("<@") || msgArgs[counter].startsWith("<@!") && msgArgs[counter].endsWith(">"))) member = message.guild.members.cache.get(msgArgs[counter].replace("<@", "").replace("!", "").replace(">", ""));
                    else member = message.guild.members.cache.get(msgArgs[counter]);

                    if (!member) flags[argument.id] = message.member;
                    else flags[argument.id] = member;
    
                    if (argument.toUser) flags[argument.id] = flags[argument.id].user;
                    break;

                case "MEMBER":
                    if ((msgArgs[counter].startsWith("<@") || msgArgs[counter].startsWith("<@!") && msgArgs[counter].endsWith(">"))) member = message.guild.members.cache.get(msgArgs[counter].replace("<@", "").replace("!", "").replace(">", ""));
                    else member = message.guild.members.cache.get(msgArgs[counter]);

                    if (!member) return { invalid: true, prompt: argument.prompt };
                    else {
                        if (argument.notBot && member.user.bot) return { invalid: true, prompt: argument.prompt };

                        if (argument.notSelf && member.id === message.author.id) return { invalid: true, prompt: argument.prompt };
                        
                        if (argument.toUser) member = member.user;
                        
                        if (amount == 1) flags[argument.id] = member;
                        else if (flags[argument.id]) flags[argument.id].push(member);
                        else flags[argument.id] = [member];
                    }
                    break;

                case "ATTACHMENT":
                    if (message.attachments.size === 0) return { invalid: true, prompt: argument.prompt };

                    attach = message.attachments.filter(a => {
                        let accepted = false;

                        argument.attachmentTypes.forEach(type => {
                            if (a.proxyURL.endsWith(type)) accepted = true;
                        });

                        return accepted;
                    });

                    if (attach.size === 0 && argument.optional) return flags;
                    else if (attach.size === 0) return { invalid: true, prompt: argument.prompt };

                    flags[argument.id] = attach.first();
                    break;

                case "TIME":
                    num = client.utils.timeToMs(msgArgs.slice(counter).join(""));

                    if (!num) return { invalid: true, prompt: argument.prompt };

                    if (argument.min && num < argument.min) return { invalid: true, prompt: argument.prompt };

                    if (argument.max && num > argument.max) return { invalid: true, prompt: argument.prompt };

                    flags[argument.id] = num;
                    break;

                default:
                    //@ts-ignore
                    log("WARNING", "src/utils/utils.js", `processArguments: the argument type '${argument.type}' doesn't exist`);
            }

            counter++
        }
    }
    return flags;
}

module.exports = processArguments;

/**
 * @typedef Arguments
 * @type {Array.<SomethingArgument|NumberArgument|ChannelArgument|RoleArgument|AuthorOrMemberArgument|MemberArgument|AttachmentArgument|TimeArgument>}
 */

 /**
  * @typedef Flags
  * @type {Object.<string, *>}
  */

/**
 * @typedef SomethingArgument
 * @type {object}
 * @property {'SOMETHING'} type - The user argument can be anything, maybe a word or a URL - anything
 * @property {string} id - The ID of this argument
 * @property {boolean} [optional] - Whether this argument is optional
 * @property {number} [amount] - The amount of arguments
 * @property {string} [prompt] - The message to send if the user doesn't provide the correct arguments
 * @property {string[]} [words] - An array of words that the user can send
 * @property {RegExp} [regexp] - The user argument should match this regular expression
 */

/**
 * @typedef NumberArgument
 * @type {object}
 * @property {'NUMBER'} type - The user argument has to be a number and will automatically be converted into a number
 * @property {string} id - The ID of this argument
 * @property {boolean} [optional] - Whether this argument is optional
 * @property {number} [amount] - The amount of arguments
 * @property {string} [prompt] - The message to send if the user doesn't provide the correct arguments
 * @property {number} [min] - The minimum that the number can be
 * @property {number} [max] - The maximum that the number can be
 * @property {boolean} [toInteger] - Whether the number should be converted into an integer
 */

/**
 * @typedef ChannelArgument
 * @type {object}
 * @property {'CHANNEL'} type - The user argument has to be a channel and will automatically be converted into a channel
 * @property {string} id - The ID of this argument
 * @property {boolean} [optional] - Whether this argument is optional
 * @property {number} [amount] - The amount of arguments
 * @property {string} [prompt] - The message to send if the user doesn't provide the correct arguments
 * @property {("GUILD_TEXT"|"DM"|"GUILD_VOICE"|"GROUP_DM"|"GUILD_CATEGORY"|"GUILD_NEWS"|"GUILD_STORE"|"GUILD_NEWS_THREAD"|"GUILD_PUBLIC_THREAD"|"GUILD_PRIVATE_THREAD"|"GUILD_STAGE_VOICE")[]} [channelTypes] - The channel types that the provided channel can be
 */

/**
 * @typedef RoleArgument
 * @type {object}
 * @property {'ROLE'} type - The user argument has to be a role and will automatically be converted into a role
 * @property {string} id - The ID of this argument
 * @property {boolean} [optional] - Whether this argument is optional
 * @property {number} [amount] - The amount of arguments
 * @property {string} [prompt] - The message to send if the user doesn't provide the correct arguments
 * @property {boolean} [notBot] - The role shouldn't be the default role of a bot
 */

/**
 * @typedef AuthorOrMemberArgument
 * @type {object}
 * @property {'AUTHOR_OR_MEMBER'} type - If the user mentions someone, it will get the mentioned member, otherwise it will be the message member
 * @property {string} id - The ID of this argument
 * @property {boolean} [toUser] - Whether or not the member should be converted into the User object
 */

/**
 * @typedef MemberArgument
 * @type {object}
 * @property {'MEMBER'} type - The user argument has to be a member and will automatically be converted into a member
 * @property {string} id - The ID of this argument
 * @property {boolean} [optional] - Whether this argument is optional
 * @property {number} [amount] - The amount of arguments
 * @property {string} [prompt] - The message to send if the user doesn't provide the correct arguments
 * @property {boolean} [notBot] - The member shouldn't be a bot
 * @property {boolean} [notSelf] - The member shouldn't be the command user
 * @property {boolean} [toUser] - Whether or not the member should be converted into the User object
 */

/**
 * @typedef AttachmentArgument
 * @type {object}
 * @property {'ATTACHMENT'} type - The message has to have an attachment
 * @property {string} id - The ID of this argument
 * @property {boolean} [optional] - Whether this argument is optional
 * @property {string} [prompt] - The message to send if the user doesn't provide the correct arguments
 * @property {string[]} attachmentTypes - The accepted attachment types
 */

/**
 * @typedef TimeArgument
 * @type {object}
 * @property {'TIME'} type - The user argument has to be time and will automatically be converted into milliseconds
 * @property {string} id - The ID of this argument
 * @property {boolean} [optional] - Whether this argument is optional
 * @property {string} [prompt] - The message to send if the user doesn't provide the correct arguments
 * @property {number} [min] - The minimum time they should provide in milliseconds
 * @property {number} [max] - The maximum time they can provide in milliseconds
 */
