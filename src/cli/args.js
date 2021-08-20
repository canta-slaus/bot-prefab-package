//@ts-check

const arg = require('arg');
const pkg = require('../../package.json');

module.exports = () => {
    const args = arg({
        "--help": Boolean,
        "--version": Boolean,
        "--new": Boolean,
        "--update": Boolean,
        "--commands": Boolean,
        "--events": Boolean,
        "--types": Boolean,
        "--info": Boolean,
        "-h": "--help",
        "-v": "--version",
        "-n": "--new",
        "-u": "--update",
        "-c": "--commands",
        "-e": "--events",
        "-t": "--types",
        "-i": "--info"
    },
    {
        permissive: true
    });

    if (args["--help"]) {
        console.log("Usage: prefab [options]");
        console.log("Options:");
        console.log("  -h, --help        Check command line options");
        console.log("  -v, --version     Check the version the package");
        console.log("  -n, --new         Create a new project");
        console.log("  -u, --update      Update current project");
        console.log("  -c, --commands    Add new command");
        console.log("  -e, --events      Add new event listener(s)");
        console.log("  -t, --types       Generate types for a schema");
        console.log("  -i, --info        Info about the package");

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
    if (args["--types"]) return "types";
    if (args["--info"]) return "info";

    return;
}
