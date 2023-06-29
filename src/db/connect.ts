import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let conn: MongoClient | null = null;
let dbClient: Db | null = null;

const connectURI: string = process.env.ATLAS_URI || "no";

export const connectDB = async () => {
  try {
    if (!conn) {
      conn = await new MongoClient(connectURI).connect();
      dbClient = conn.db("wonder");
      console.log("MongoDB connected!!");
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const db = () => dbClient;

export default db;
