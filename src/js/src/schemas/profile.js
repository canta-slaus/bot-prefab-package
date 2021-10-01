// @ts-check
const { Schema, model } = require("mongoose");
const { prefabProfile } = require("../../prefab/schemas");

const user = new Schema({
	_id: String,
	prefab: prefabProfile

	// You can add your own things after this
});

module.exports = model("users", user);