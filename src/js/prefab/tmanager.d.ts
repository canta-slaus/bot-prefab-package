import { FilterQuery, UpdateQuery, QueryOptions, Query } from "mongoose";
import { Collection } from "discord.js";

declare class Manager <K, V> {
	get (key: K, force?: Boolean): Promise<V>;
	getCache (key: K): V;
	findById (key: K): Promise<V>;
	findOne (filter: FilterQuery<V>): Promise<V>;
	findMany (filter: FilterQuery<V>): Promise<V[]>;
	findByIdAndUpdate (key: K, update: UpdateQuery<V>, options?: QueryOptions): Promise<V>;
	findOneAndUpdate (filter: FilterQuery<V>, update: UpdateQuery<V>, options?: QueryOptions): Promise<V>;
	updateMany (filter: FilterQuery<V>, update: UpdateQuery<V>, options?: QueryOptions): Promise<{ ok: number, n: number, nModified: number }>;
	findByIdAndDelete (key: K, options?: QueryOptions): Promise<V>;
	findOneAndDelete (filter: FilterQuery<V>, options?: QueryOptions): Promise<V>;
	deleteMany (filter: FilterQuery<V>, options?: QueryOptions): void;
	insertOne (item: V): Promise<Query>;
	insertMany (items: V[]): Promise<Query>;
	exists (key: K): Promise<boolean>;
	countItems (filter: FilterQuery<V>): Promise<number>;
    cache: Collection<K, V>;
    model: Model<V>;
}

export { Manager };
export default Manager;