import { Collection } from "discord.js";
import { FilterQuery, Model, QueryOptions, UpdateQuery } from "mongoose";
import { Client } from "../src/util/client";

class Manager <K, V> {
    _client: Client;
    _model: Model<V>
    _cache: Collection<K, V>;

    constructor (client: any, model: Model<V>) {
    	this._client = client;
    	this._model = model;
    	this._cache = new Collection();
    }

    async get (key: K, force?: boolean): Promise<V> {
    	let item = this._cache.get(key);

    	if (!item || force) {
    		item = await this._model.findOneAndUpdate({ _id: key }, { }, { new: true, upsert: true, setDefaultsOnInsert: true });
    		this._cache.set(key, item);
    	}

    	return item;
    }

    getCache (key: K) {
    	return this._cache.get(key);
    }

    async findById (key: K) {
    	return await this.findOne({ _id: key });
    }

    async findOne (filter: FilterQuery<V>) {
    	const item = await this._model.findOne(filter);

    	if (!item) return;

    	this._cache.set(item._id, item);

    	return item;
    }

    async findMany (filter: FilterQuery<V>) {
    	const items = await this._model.find(filter);

    	for (const item of items) this._cache.set(item._id, item);

    	return items;
    }

    async findByIdAndUpdate (key: K, update: UpdateQuery<V>, options?: QueryOptions) {
    	return await this.findOneAndUpdate({ _id: key }, update, options);
    }

    async findOneAndUpdate (filter: FilterQuery<V>, update: UpdateQuery<V>, options?: QueryOptions) {
    	const item = await this._model.findOneAndUpdate(filter, update, options);

    	if (!item) return;

    	this._cache.set(item._id, item);

    	return item;
    }

    async updateMany (filter: FilterQuery<V>, update: UpdateQuery<V>, options?: QueryOptions) {
    	const query = await this._model.updateMany(filter, update, options);

    	return query;
    }

    async findByIdAndDelete (key: K, options?: QueryOptions) {
    	return await this.findOneAndDelete({ _id: key }, options);
    }

    async findOneAndDelete (filter: FilterQuery<V>, options?: QueryOptions) {
    	const item = await this._model.findOneAndDelete(filter, options);

    	if (!item) return;

    	this._cache.delete(item._id);

    	return item;
    }

    async deleteMany (filter: FilterQuery<V>, options?: QueryOptions) {
    	await this._model.deleteMany(filter, options);
    }

    async insertOne (item: V) {
    	if (!item) return;

    	return (await this.insertMany([item]))![0];
    }

    async insertMany (items: V[]) {
    	if (!items || !items.length) return;

    	const query = await this._model.insertMany(items);

    	for (const item of query) this._cache.set(item._id, item);

    	return query;
    }

    async exists (key: K) {
    	if (!key) return false;

    	let item = this._cache.get(key);

    	if (!item) item = await this.findOne({ _id: key });

    	return Boolean(item);
    }

    async countItems (filter: FilterQuery<V>) {
    	return await this._model.countDocuments(filter);
    }

    get cache () {
    	return this._cache;
    }

    get model () {
    	return this._model;
    }
}

export { Manager };