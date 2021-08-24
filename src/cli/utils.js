//@ts-check

const fs = require('fs-extra');
const path = require('path');
const dir = process.cwd();

const colors = {
    "SUCCESS": "\u001b[32m",
    "WARNING": "\u001b[33m",
    "ERROR": "\u001b[31m",
    "CLEAR": "\u001b[0m"
}

/**
 * @returns {Promise<Settings>}
 */
const getSettings = async () => {
    const src = path.join(dir, "config", "settings.json");
    const settings = JSON.parse(await fs.readFile(src, { encoding: "utf8" }));

    let rewrite = false;

    if (!settings.language) {
        const files = await fs.readdir(path.join(dir));

        for (const file of files) {
            const stat = await fs.lstat(path.join(dir, file));

            if (stat.isDirectory()) continue;

            if (file.includes(".js")) settings.language = "js";
            else settings.language = "ts";

            break;
        }

        rewrite = true;
    }

    if (rewrite) await fs.writeFile(src, JSON.stringify(settings, null, 4));

    return settings;
}

const isTemplate = async () => await fs.pathExists(path.join(dir, "config", "settings.json"));

/**
 * @param {string} string 
 */
const cap = (string) => string.charAt(0).toUpperCase() + string.slice(1);

/**
 * @param {ConsoleColors} type 
 * @param {string} text 
 */
const log = (type, text) => console.log(`${colors[type]}${type === "CLEAR" ? "" : ">"} ${text}${colors.CLEAR}`);

module.exports = {
    isTemplate, cap, getSettings, log
}

/**
 * @typedef Settings 
 * @type {object} 
 * @property {string} version 
 * @property {'js'|'ts'} language 
 */

/**
 * @typedef ConsoleColors 
 * @type {'SUCCESS'|'WARNING'|'ERROR'|'CLEAR'}
 */

