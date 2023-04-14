import express, {Express, Request, Response} from "express"
import mongoose, {ConnectOptions} from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const dbURI = "mongodb://127.0.0.1:27017/test";

const mongooseOptions:ConnectOptions = {
}

app.use(express.json());
app.use(cors());

mongoose.connect(dbURI,mongooseOptions).then(()=>console.log("MongoDB connected...")).catch((err)=>console.log(err));

app.listen(port,()=>{
    console.log(`[server]: Server is running at http://localhost:${port}`)
})
