import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import index from "./routes/index";
import { connectDB } from "./db/connect";
import wonder from "./routes/wonder";
import user from "./routes/user";
import creator from "./routes/creator";

/*** basics ***/
dotenv.config();
const app: Express = express();
const port = process.env.PORT;


/*** middlewares ***/
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*** connect DB ***/
connectDB().catch(()=> console.log("DB connection failed"));


/*** routes ***/
app.use("/", index);
app.use("/user", user);
app.use("/wonder", wonder);
app.use("/creator", creator);

/*** open server ***/
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port ?? "invalid port"}`);
});

/* 
import {
  Strategy as NaverStrategy,
  Profile as NaverProfile,
} from "passport-naver-v2";
import axios from "axios";
import { User } from "./model/user"; 
*/

/*
passport.use(
  new NaverStrategy(
    {
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: "/login/callback",
    },
    (
      accessToken: string,
      refreshToken: string,
      profile: NaverProfile,
      done: any,
    ) => {
      console.log(accessToken);
      console.log(refreshToken);
      console.log(profile);
      console.log(done);
      done(null, profile);
    },
  ),
);

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

app.use(passport.initialize());
*/


/* 
app.post("/login/naver", async (req, res) => {
  const data = req.body as { code: string };
  try {
    const tokenResponse = await axios.get(
      "https://nid.naver.com/oauth2.0/token",
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.NAVER_CLIENT_ID,
          client_secret: process.env.NAVER_CLIENT_SECRET,
          code: data.code,
          state: "naver",
        },
      },
    );
    const tokens = tokenResponse.data as {
      access_token: string;
      refresh_token: string;
    };
    const profileResponse = await axios.get(
      "https://openapi.naver.com/v1/nid/me",
      {
        headers: { Authorization: `bearer ${tokens.access_token}` },
      },
    );
    const { response: profile } = profileResponse.data as {
      response: { id: string; email: string };
    };

    const existingUser = await User.findOne({
      platformId: profile.id,
    });
    if (existingUser) {
      if (existingUser.name && existingUser.phoneNumber) {
        res.json({ user: existingUser, needRegister: false });
      } else {
        res.json({ user: existingUser, needRegister: true });
      }
    } else {
      const date = Date();
      const newUser = await User.create({
        platformType: "naver",
        platformId: profile.id,
        email: profile.email,
        created_at: date,
        last_modified_at: date,
      });
      await newUser.save();
      console.log("new user saved!");
      res.json({ user: newUser, needRegister: true });
    }

    //res.json(profileResponse.data);
  } catch (e) {
    res.json(e);
  }
});

app.post("/register", async (req, res) => {
  const { id, name, phoneNumber } = req.body as {
    id: string;
    name: string;
    phoneNumber: string;
  };
  console.log(id);
  await User.updateOne({ platformId: id }, { name, phoneNumber });
  const existingUser = await User.findOne({ platformId: id });
  console.log(existingUser);
  if (existingUser) {
    res.json(existingUser);
  }
});
*/

