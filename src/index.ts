import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import index from "./routes/index";
import db, { connectDB } from "./db/connect";
import wonder from "./routes/wonder";
import user from "./routes/user";
import creator from "./routes/creator";
import defineScenario from "./libs/flow/express";
import {
  extractRequest,
  setData,
  setContext,
  appendData,
  promptWithFlag,
  cutData,
  parseContextToInt,
  promptFlow,
} from "./libs/flow";
import { Wonder } from "./types/wonder";
import { dbFindOne } from "./libs/flow/mongodb";
import { WithId } from "mongodb";
import { initUniqueId } from "./functions/uniqueId";

/*** basics ***/
dotenv.config();
const app: Express = express();
const port = process.env.PORT;

/*** middlewares ***/
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.disable("etag");

/*** connect DB ***/
connectDB()
  .then(() => {
    initUniqueId().catch(() => console.log("init unique id failed"));
  })
  .catch(() => console.log("DB connection failed"));

/*** routes ***/
app.use("/", index);
app.use("/user", user);
app.use("/wonder", wonder);
app.use("/creator", creator);

app.get(
  "/newScenario/:wonder_id",
  defineScenario(
    extractRequest({ params: ["wonder_id"], query: [], headers: [] } as const),
    parseContextToInt("wonder_id"),
    setContext<{ id: number }, { wonder_id: number }>((f) =>
      Promise.resolve({ id: f.context.wonder_id }),
    )("filter"),
    setData<WithId<Wonder>, { wonder_id: number }>((f) =>
      dbFindOne<Wonder>("wonder")({ id: f.context.wonder_id })(db()),
    ),
    cutData("_id"),
    promptFlow,
  ),
);

/*** open server ***/
app.listen(port, () => {
  console.log(
    `[server]: Server is running at http://localhost:${port ?? "invalid port"}`,
  );
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
