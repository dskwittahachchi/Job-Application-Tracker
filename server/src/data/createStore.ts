import mongoose from "mongoose";
import { env } from "../config/env.js";
import { MemoryDataStore, MongoDataStore, type DataStore } from "./store.js";

export async function createDataStore(options?: {
  forceMemory?: boolean;
  seed?: boolean;
}): Promise<DataStore> {
  if (options?.forceMemory || !env.mongoUri) {
    return MemoryDataStore.create({ seed: options?.seed });
  }

  await mongoose.connect(env.mongoUri);
  return new MongoDataStore();
}
