//@ts-check

const { Collection } = require('discord.js');

class Manager {
    /**
     * @param {import('./client')} client 
     * @param {import('mongoose').Model} model
     */
    constructor (client, model) {
        this._client = client;
        this._model = model;
        this._cache = new Collection();
    }

    async get (key) {
        let item = this._cache.get(key);
        if (!item) {
            item = await this._model.findOneAndUpdate({ _id: key }, {  }, { new: true, upsert: true, setDefaultsOnInsert: true });
            this._cache.set(key, item);
        }

        return item;
    }

    getCache (key) {
        return this._cache.get(key);
    }

    async findById (key) {
        return this.findOne({ _id: key });
    }

    async findOne (filter) {
        const item = await this._model.findOne(filter);
        this._cache.set(item._id, item);
        return item;
    }

    async findMany (filter) {
        const items = await this._model.find(filter);
        for (const item of items) this._cache.set(item._id, item);
        return items;
    }

    async findByIdAndUpdate (key, update, options) {
        return this.findOneAndUpdate({ _id: key }, update, options);
    }

    async findOneAndUpdate (filter, update, options) {
        const item = await this._model.findOneAndUpdate(filter, update, options);
        this._cache.set(item._id, item);
        return item;
    }

    async updateMany (filter, update, options) {
        const query = await this._model.updateMany(filter, update, options);
        return query;
    }

    async findByIdAndDelete (key) {
        await this._model.deleteOne({ _id: key });
        const item = this.cache.get(key);
        this._cache.delete(key);
        return item;
    }

    async findOneAndDelete (filter) {
        await this._model.deleteOne(filter);
    }

    async deleteMany (filter) {
        await this._model.deleteMany(filter);
    }

    async insertOne (item) {
        return (await this.insertMany([item]))[0];
    }

    async insertMany (items) {
        const query = await this._model.insertMany(items);
        for (const item of query) this._cache.set(item._id, item);
        return query;
    }

    async exists (key) {
        let item = this._cache.get(key);
        if (!item) item = await this.findById(key);
        return !!item;
    }

    async countItems (filter) {
        return await this._model.countDocuments(filter);
    }

    get cache () {
        return this._cache;
    }

    get model () {
        return this._model;
    }
}

module.exports = Manager;
