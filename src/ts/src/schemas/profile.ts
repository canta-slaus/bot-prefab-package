import { Schema, model } from "mongoose";
import { prefabProfile } from "../../prefab/schemas";

const user = new Schema({
	_id: String,
	prefab: prefabProfile

	// You can add your own things after this
});

export = model("users", user);