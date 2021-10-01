// @ts-check
const prompts = require("prompts");
const fs = require("fs-extra");
const path = require("path");
const dir = process.cwd();

const { isTemplate, cap, getSettings, log } = require("./utils");

module.exports = async () => {
	if (!await isTemplate()) return log("ERROR", "This doesn't seem to be a project made using this package!");

	const settings = await getSettings();

	if (settings.language !== "js") return console.log("\u001b[33m> This feature is currently limited to JavaScript!\u001b[0m");

	const schemas = await fs.readdir(path.join(dir, "src", "schemas"));
	const { schema } = await prompts([
		{
			type: "select",
			name: "schema",
			choices: schemas.filter(f => f.endsWith(".js")).map(f => { return { title: f, value: f }; }),
			message: "Which schema would you like to generate the type for?"
		}
	]);

	if (!schema) return;

	log("WARNING", "Fetching schema and generating type...");
	const model = require(path.join(dir, "src", "schemas", schema));
	const types = getObjectTypes(model.schema.obj, 4);
	log("SUCCESS", "Fetched the schema and successfully generated the type!");

	log("WARNING", "Adding .d.ts file...");
	const file = path.join(dir, "src", "types", schema.replace(".js", ".d.ts"));
	await fs.remove(file);

	const name = cap(schema.replace(".js", ""));
	await fs.writeFile(file, `declare interface ${name} {\n${types}}\n\nexport { ${name} };\n`);
	log("SUCCESS", "Added the .d.ts file!");

	log("CLEAR", "\u001b[34m> If this is a new schema, here is a copy-paste to add to your client in \"src/util/client.js\":\u001b[0m\n");
	log("CLEAR", `\u001b[32m/** @type {import('../../prefab/tmanager').Manager<${types.match(/_id: (\D*?);/)[1]}, import('../types/${name.toLowerCase()}').${name}>} */\u001b[0m`);
	log("CLEAR", `\u001b[34mthis\u001b[0m.${name.toLowerCase()} = \u001b[34mnew\u001b[0m \u001b[33mManager\u001b[0m(\u001b[34mthis\u001b[33m, require\u001b[0m(\u001b[31m'../schemas/${schema.replace(".js", "")}'\u001b[0m));`);
};

/**
 * @param {Object.<*, *>} obj
 * @param {number} [depth]
 * @param {boolean} [name]
 */
function getObjectTypes (obj, depth = 0, name = true) {
	let type = "";

	if (typeof obj === "object") {
		for (const key of Object.keys(obj)) {
			type += `${" ".repeat(depth)}${name ? `${key}: ` : ""}`;
			type += getObjectType(obj[key], depth);
		}
	} else {
		type += getObjectType(obj, depth);
	}

	return type;
}

/**
 * @param {Object.<*, *>} obj
 * @param {number} [depth]
 */
function getObjectType (obj, depth = 0) {
	let type = "";

	if (typeof obj === "function") {
		type += `${obj.name.toLowerCase()};\n`;
	} else if (Array.isArray(obj)) {
		if (typeof obj[0] === "function") {
			type += `${obj[0].name.toLowerCase()}[];\n`;
		} else if (typeof obj[0] === "object") {
			type += `{\n${getObjectTypes(obj[0], depth + 4)}${" ".repeat(depth)}}[];\n`;
		}
	} else if (typeof obj === "object") {
		if (!Object.keys(obj).length) type += "any;\n";
		else if (obj.type) type += `${getObjectTypes(obj.type, depth + 4)}`;
		else type += `{\n${getObjectTypes(obj, depth + 4)}${" ".repeat(depth)}};\n`;
	} else {
		throw new Error("Your schema contains content that is not yet supported by this tool (only arrays, nested objects, StringConstructors, NumberConstructors and BooleanContructors are officially supported)!");
	}

	return type;
}