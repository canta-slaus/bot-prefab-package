// @ts-check
const fs = require("fs-extra");
const path = require("path");

const { isTemplate, log } = require("./utils");

const types = [ "STRING", "INTEGER", "BOOLEAN", "USER", "CHANNEL", "ROLE", "MENTIONABLE", "NUMBER",
	3, 4, 5, 6, 7, 8, 9, 10 ];
const choicesAllowed = [ "STRING", "INTEGER", "NUMBER",
	3, 4, 5 ];
const optionsAllowed = [ "SUB_COMMAND", "SUB_COMMAND_GROUP",
	1, 2 ];
const permissionTypes = [ "ROLE", "USER",
	1, 2 ];
const commands = [];

let allValid = true;
let required = 0;

module.exports = async () => {
	if (!await isTemplate()) return log("ERROR", "This doesn't seem to be a project made using this package!");

	await validateCommands(path.join(process.cwd(), "src", "commands"));

	if (commands.filter(c => c.development).length > 100) logInvalidate("WARNING", "You have more than 100 guild-only commands for the development server");
	if (commands.filter(c => !c.development).length > 100) logInvalidate("WARNING", "You have more than 100 global commands");

	if (allValid) log("SUCCESS", "Done! Didn't find any *obvious* issues in settings!");
	else log("WARNING", "Done! Make sure to check out some of the major errors!");
};

/**
 * @param  {string} dir
 */
async function validateCommands(dir) {
	const files = await fs.readdir(path.join(dir));

	for (const file of files) {
		const stat = await fs.lstat(path.join(dir, file));

		if (file.includes("-ignore")) continue;

		if (stat.isDirectory())
			await validateCommands(path.join(dir, file));
		else if (file.endsWith(".js")) {
			required = 0;
			const cmdPath = path.join(dir, file);
			const command = new (require(cmdPath))();

			const { name, category, description, options, permissions } = command;

			if (typeof command !== "object") {
				logInvalidate("ERROR", `The file '${cmdPath}' doesn't export an object`);
				continue;
			}

			try {
				if (typeof name === "undefined") logInvalidate("ERROR", `'${cmdPath}': command missing name`);
				else if (typeof name !== "string") logInvalidate("ERROR", `'${cmdPath}': command.name '${name}' not a string`);
				else if (!(/^[a-z0-9_-]{1,32}$/).test(name)) logInvalidate("ERROR", `'${name}' (${cmdPath}): command.name '${name}' doesn't match '/^[a-z0-9_-]{1,32}$/'`);
				else if (commands.findIndex(c => c.name === name) !== -1) logInvalidate("WARNING", `'${name}' (${cmdPath}) command.name has already been added`);

				if (typeof description === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): command missing description`);
				else if (typeof description !== "string") logInvalidate("ERROR", `'${name}' (${cmdPath}): command.description not a string`);
				else if (!description.length || description.length > 100) logInvalidate("ERROR", `'${name}' (${cmdPath}): command.description too long or too short`);

				if (typeof category === "undefined") logInvalidate("WARNING", `'${name}' (${cmdPath}): command missing category`);
				else if (typeof category !== "string") logInvalidate("WARNING", `'${name}' (${cmdPath}): command.category not a string`);

				if (typeof options !== "undefined") {
					if (!Array.isArray(options)) {
						logInvalidate("ERROR", `'${name}' (${cmdPath}): Options not an array`);
					} else if (options.length > 25) logInvalidate("ERROR", `'${name}' (${cmdPath}): command.options more than 25 options`);
					else if (options.length) {
						if (options[0].type === "SUB_COMMAND_GROUP") options.forEach((group, i) => validateSubcommandGroup({ name, cmdPath, group, i }));
						else if (options[0].type === "SUB_COMMAND") options.forEach((subcommand, i) => validateSubcommand({ name, cmdPath, subcommand, i }));
						else options.forEach((option, i) => validateArgument({ name, cmdPath, option, i }));
					}
				}

				if (typeof permissions !== "undefined") {
					if (!Array.isArray(permissions)) {
						logInvalidate("ERROR", `'${name}' (${cmdPath}): command.permissions not an array`);
					} else if (permissions.length > 10) logInvalidate("ERROR", `'${name}' (${cmdPath}): command.permissions more than 10 overwrites`);
					else {
						permissions.forEach((permission, i) => {
							if (typeof permission === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): command.permissions[${i}] empty`);
							else if (typeof permission !== "object") logInvalidate("ERROR", `'${name}' (${cmdPath}): command.permissions[${i}] not an object`);
							else {
								if (!permission.id) logInvalidate("ERROR", `'${name}' (${cmdPath}): command.permissions[${i}] missing ID`);
								else if (typeof permission.id !== "string") logInvalidate("ERROR", `'${name}' (${cmdPath}): command.permissions[${i}].id not a string`);

								if (!permission.type) logInvalidate("ERROR", `'${name}' (${cmdPath}): command.permissions[${i}] missing type`);
								else if (!permissionTypes.includes(permission.type)) logInvalidate("ERROR", `'${name}' (${cmdPath}): command.permissions[${i}].type invalid type`);

								if (typeof permission.permission !== "boolean") logInvalidate("ERROR", `'${name}' (${cmdPath}): command.permissions[${i}].permission not a boolean value`);
							}
						});
					}
				}

				commands.push(command);
			} catch (e) {
				logInvalidate("ERROR", `Error loading command '${name}' (${cmdPath}):\n`);
				console.log(e);
			}
		}
	}
}

function validateSubcommandGroup ({ name, cmdPath, group, i }) {
	const path = `command.options[${i}]`;

	if (typeof group.type === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path} missing type`);
	else if (typeof group.type !== "string") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.type not a string`);
	else if (group.type !== "SUB_COMMAND_GROUP" && group.type !== 2) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.type not a 'SUB_COMMAND_GROUP' type`);
	else {
		if (typeof group.name === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path} missing name`);
		else if (typeof group.name !== "string") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.name not a string`);
		else if (!(/^[a-z0-9_-]{1,32}$/).test(group.name)) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.name doesn't match '/^[a-z0-9_-]{1,32}$/'`);

		if (typeof group.description === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path} missing description`);
		else if (typeof group.description !== "string") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.description not a string`);
		else if (!group.description.length || group.description.length > 100) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.description too short or too long`);

		if (typeof group.options === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path} missing options`);
		else if (!Array.isArray(group.options)) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.options not an array`);
		else if (group.options.length > 25) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.options more than 25 options`);
		else group.options.forEach((subcommand, j) => validateSubcommand({ name, cmdPath, subcommand, i, j }));

		if (typeof group.required !== "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.required not allowed on type 'SUB_COMMAND_GROUP'`);
	}
}

function validateSubcommand ({ name, cmdPath, subcommand, i, j = -1 }) {
	required = 0;
	const path = `command.options[${i}]${j !== -1 ? `.options[${j}]` : ""}`;

	if (typeof subcommand.type === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path} missing type`);
	else if (typeof subcommand.type !== "string") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.type not a string`);
	else if (subcommand.type !== "SUB_COMMAND" && subcommand.type !== 1) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.type not a 'SUB_COMMAND' type`);
	else {
		if (typeof subcommand.name === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path} missing name`);
		else if (typeof subcommand.name !== "string") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.name not a string`);
		else if (!(/^[a-z0-9_-]{1,32}$/).test(subcommand.name)) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.name doesn't match '/^[a-z0-9_-]{1,32}$/'`);

		if (typeof subcommand.description === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path} missing description`);
		else if (typeof subcommand.description !== "string") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.description not a string`);
		else if (!subcommand.description.length || subcommand.description.length > 100) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.description too short or too long`);

		if (typeof subcommand.options !== "undefined") {
			if (!Array.isArray(subcommand.options)) {
				logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.options not an array`);
			} else if (subcommand.length > 25) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.options more than 25 options`);
			else subcommand.options.forEach((option, k) => validateArgument({ name, cmdPath, option, i, j: k, k: -1 }));
		}

		if (typeof subcommand.required !== "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.required not allowed on type 'SUB_COMMAND'`);
	}
}

function validateArgument ({ name, cmdPath, option, i, j = -1, k = -1 }) {
	const path = `command.options[${i}]${j !== -1 ? `.options[${j}]${k !== -1 ? `.options[${k}]` : ""}` : ""}`;

	if (typeof option === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path} empty`);
	else if (typeof option !== "object") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path} not an object`);
	else {
		if (!option.type) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path} missing type`);
		else if (!types.includes(option.type)) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.type invalid type`);

		if (typeof option.name === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path} missing name`);
		else if (typeof option.name !== "string") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.name not a string`);
		else if (!(/^[a-z0-9_-]{1,32}$/).test(option.name)) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.name doesn't match '/^[a-z0-9_-]{1,32}$/'`);

		if (typeof option.description === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path} missing description`);
		else if (typeof option.description !== "string") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.description not a string`);
		else if (!option.description.length || option.description.length > 100) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.description too short or too long`);

		if (typeof option.choices !== "undefined") {
			if (!choicesAllowed.includes(option.type)) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.choices not allowed on type '${option.type}'`);
			else if (!Array.isArray(option.choices)) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.choices not an array`);
			else if (option.choices.length > 25) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.choices more than 25 choices`);
			else {
				option.choices.forEach((choice, j) => {
					if (typeof choice === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.choices[${j}] empty`);
					else if (typeof choice !== "object") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.choices[${j}] not an object`);
					else {
						if (typeof choice.name === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.choices[${j}] missing name`);
						else if (typeof choice.name !== "string") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.choices[${j}].name not a string`);
						else if (!choice.name.length || choice.name.length > 100) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.choices[${j}].name too long or too short`);

						if (typeof choice.value === "undefined") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.choices[${j}] missing value`);
						else if (option.type === "STRING" || option.type === 3) {
							if (typeof choice.value !== "string") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.choices[${j}].value not a string`);
							else if (choice.value.length > 100) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.choices[${j}].value too long`);
						} else if ((option.type === "INTEGER" || option.type === "NUMBER" || option.type === 4 || option.type === 10) && typeof choice.value !== "number") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.choices[${j}].value not a number`);
					}
				});
			}
		}

		if (typeof option.required !== "undefined" && typeof option.required !== "boolean") logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.required not a boolean value`);
		else if (option.required) {
			if (required === 0) required = 2;
			else if (required !== 2) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path} required options must be listed before optional options`);
		} else if (required === 0) required = 1;
		else if (required === 2) required = 1;

		if (typeof option.options !== "undefined" && !optionsAllowed.includes(option.type)) logInvalidate("ERROR", `'${name}' (${cmdPath}): ${path}.options not allowed on type '${option.type}'`);
	}
}

/**
 * @param {import('./utils').ConsoleColors} type
 * @param {string} text
 */
const logInvalidate = (type, text) => {
	log(type, text);
	allValid = false;
};