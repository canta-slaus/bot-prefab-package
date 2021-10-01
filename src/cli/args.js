// @ts-check
const arg = require("arg");
const pkg = require("../../package.json");

module.exports = () => {
	const args = arg({
		"--help": Boolean,
		"--version": Boolean,
		"--new": Boolean,
		"--update": Boolean,
		"--commands": Boolean,
		"--events": Boolean,
		"--extra": Boolean,
		"--types": Boolean,
		"--validate": Boolean,
		"--parse": Boolean,
		"--info": Boolean,
		"-h": "--help",
		"-v": "--version",
		"-n": "--new",
		"-u": "--update",
		"-c": "--commands",
		"-e": "--events",
		"-x": "--extra",
		"-t": "--types",
		"-p": "--parse",
		"-i": "--info"
	},
	{ permissive: true });

	if (args["--help"]) {
		console.log("Usage: prefab [options]");
		console.log("Options:");
		console.log("  -h,    --help        Check command line options");
		console.log("  -v,    --version     Check the version the package");
		console.log("  -n,    --new         Create a new project");
		console.log("  -u,    --update      Update current project");
		console.log("  -c,    --commands    Add new command");
		console.log("  -ev,   --events      Add new event listener(s)");
		console.log("  -ex,   --extra       Additional tools");
		console.log("  -t,    --types       Generate types for a schema");
		console.log("  -val,  --validate    Check if your command names/descriptions/... are valid");
		console.log("  -p,    --parse       Parse 'normal' slash command options to the prefab format");
		console.log("                       to e.g. make use of the subcommand (group) handler");
		console.log("  -i,    --info        Info about the package");

		return "help";
	}

	if (args["--version"]) {
		console.log(`v${pkg.version}`);

		return "version";
	}

	if (args["--new"]) return "new";
	if (args["--update"]) return "update";
	if (args["--commands"]) return "commands";
	if (args["--events"]) return "events";
	if (args["--extra"]) return "extra";
	if (args["--types"]) return "types";
	if (args["--validate"]) return "validate";
	if (args["--parse"]) return "parse";
	if (args["--info"]) return "info";
};