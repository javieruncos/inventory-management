import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

type GlobalWithMongoose = typeof globalThis & {
  __mongooseCache?: MongooseCache;
};

const globalWithMongoose = globalThis as GlobalWithMongoose;

const cache: MongooseCache =
  globalWithMongoose.__mongooseCache ?? { conn: null, promise: null };

globalWithMongoose.__mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI no está definida. Añádela al archivo .env del proyecto.",
    );
  }

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri);
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
