//@ts-check

const ms = require('ms');

/**
 * Function to check if the user has passed in the proper arguments when using a command
 * @param {import('discord.js').Message} message - The message to check the arguments for
 * @param {string[]} msgArgs - The arguments given by the user
 * @param {*} expectedArgs - The expected arguments for the command
 * @returns {*} Returns the arguments mapped by their ID's if all the arguments were as expected, else, returns `undefined/false`
 */
function processArguments(message, msgArgs, expectedArgs) {
    let counter = 0;
    let amount, num, role, member, channel, attach, time;
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
                    time = msgArgs.slice(counter).join("").match(/(\d*)(\D*)/g);
                    time.pop();

                    num = 0;
                    for (let i = 0; i < time.length; i++) {
                        try {
                            num += ms(time[i]);
                        } catch (e) {
                            return { invalid: true, prompt: argument.prompt };
                        }
                    }

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
