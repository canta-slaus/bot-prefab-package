import { Schema, model } from 'mongoose';
import { prefabGuild } from '../../prefab/schemas';

const guild = new Schema({
    _id: String,
    prefab: prefabGuild,

    // You can add your own things after this 
});

export = model('guilds', guild);
