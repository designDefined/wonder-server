import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let conn: MongoClient | null = null;
let dbClient: Db | null = null;

const connectURI: string = process.env.ATLAS_URI || "";

export const connectDB = async () => {
  try {
    if (!conn) {
      console.log(connectURI);
      conn = await new MongoClient(connectURI).connect();
      dbClient = conn.db("wonder");
      console.log("MongoDB connected!!");
    }
  } catch (e) {
    console.error(e);
  }
};

const db = () => dbClient;

export default db;
