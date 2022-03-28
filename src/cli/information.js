//@ts-check

/**
 * @type {import('./utils').CLICommand}
 */
module.exports = {
    long: "info",
    short: "i",
    description: "General information about the package",
    title: "Information",
    promptIndex: 4,
    extra: true,

    run: async () => {
        console.log("");
        console.log("   \u001b[34;1m┌────────────────────── \u001b[34;1mbot-prefab-package \u001b[34;1m─────────────────────┐");
        console.log("   │   \u001b[33mThis CLI was made based on my original bot-prefab to make   \u001b[34;1m│");
        console.log("   │                 \u001b[33mcreating new projects easier.                 \u001b[34;1m│");
        console.log("   \u001b[34;1m├───────────────────────────────────────────────────────────────┤")
        console.log("   │   \u001b[33mGitHub: \u001b[36;1mhttps://github.com/canta-slaus/bot-prefab-package   \u001b[34;1m│");
        console.log("   │       \u001b[33mnpm: \u001b[36;1mhttps://npmjs.com/package/bot-prefab-package       \u001b[34;1m│");
        console.log("   │             \u001b[33mDiscord: \u001b[36;1mhttps://discord.gg/eN8PfTRgh6            \u001b[34;1m│");
        console.log("   └───────────────────────────────────────────────────────────────┘\u001b[0m");
        console.log("");
    }
}
