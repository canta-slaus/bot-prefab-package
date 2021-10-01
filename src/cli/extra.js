// @ts-check
const prompts = require("prompts");

const types = require("./types");
const validate = require("./validate");
const parse = require("./parse");

module.exports = async () => {
	const { action } = await prompts([
		{
			type: "select",
			name: "action",
			message: "Which tool do you want to use?",
			choices: [
				{ title: "┌ Add types", description: "Add the needed type declarations for a schema!", value: "types" },
				{ title: "├ Validate commands", description: "Update your current project to the newest version!", value: "validate" },
				{ title: "└ Parse options", description: "Get some information about this CLI tool!", value: "parse", disabled: true }
			],
			warn: "This is still WIP!",
			hint: "Use arrow keys to navigate. Hit \"ENTER\" to select."
		}
	]);

	if (!action) return;

	if (action === "types") await types();
	else if (action === "validate") await validate();
	else if (action === "parse") await parse();
};