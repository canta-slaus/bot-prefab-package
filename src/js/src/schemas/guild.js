// @ts-check
const { Schema, model } = require("mongoose");
const { prefabGuild } = require("../../prefab/schemas");

const guild = new Schema({
	_id: String,
	prefab: prefabGuild

	// You can add your own things after this
});

module.exports = model("guilds", guild);