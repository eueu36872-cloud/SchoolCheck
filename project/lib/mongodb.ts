import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI as string;

const MONGODB_DB =
  process.env.MONGODB_DB as string;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI가 .env.local에 설정되지 않았습니다."
  );
}

if (!MONGODB_DB) {
  throw new Error(
    "MONGODB_DB가 .env.local에 설정되지 않았습니다."
  );
}

const globalForMongoose =
  globalThis as unknown as {
    mongoose: {
      conn: typeof mongoose | null;
      promise:
        | Promise<typeof mongoose>
        | null;
    };
  };

export async function connectDB() {
  if (
    globalForMongoose.mongoose?.conn
  ) {
    return globalForMongoose.mongoose.conn;
  }

  if (
    !globalForMongoose.mongoose
  ) {
    globalForMongoose.mongoose = {
      conn: null,
      promise: null,
    };
  }

  if (
    !globalForMongoose.mongoose.promise
  ) {
    globalForMongoose.mongoose.promise =
      mongoose.connect(
        MONGODB_URI,
        {
          dbName: MONGODB_DB,
        }
      );
  }

  globalForMongoose.mongoose.conn =
    await globalForMongoose.mongoose
      .promise;

  return globalForMongoose.mongoose.conn;
}