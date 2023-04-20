import express, { Application, Express, Request, Response } from "express";
import mongoose, { ConnectOptions } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import sample from "./routes/sample";
import index from "./routes/index";
import { Kitten } from "./model/sample";
import { User } from "./model/user";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const dbURI = "mongodb://127.0.0.1:27017/test";

const mongooseOptions: ConnectOptions = {};

app.use(express.json());
app.use(cors());

mongoose
  .connect(dbURI, mongooseOptions)
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));

app.use("/", index);
app.use("/sample", sample);

app.get("/login", (req, res) => {
  setTimeout(() => {
    res.status(200).json({ name: "jy" });
  }, 5000);
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
