import { Router } from "express";
import defineScenario from "../libs/flow/express";
import {
  checkFlow,
  cutData,
  extractBody,
  extractRequest,
  isErrorReport,
  promptWithFlag,
  raiseScenarioError,
  raiseScenarioErrorWithReport,
  raiseSimpleError,
  setContext,
  setData,
} from "../libs/flow";
import { dbFindOne, dbInsertOne } from "../libs/flow/mongodb";
import db from "../db/connect";
import { DB, Schema } from "../types/db";
import {
  UserLoggedIn,
  UserNeedRegister,
  UserRegisterForm,
} from "../types/user";
import { sign, verify } from "jsonwebtoken";
import { prepareNewUser, toUserLoggedIn } from "../functions/user";
import { ObjectId } from "mongodb";
import { authorizeUser } from "../functions/auth";
/* 
import defineScenario, {
  extractRequest,
  findAll,
  findOne,
  mapCache,
  parseCacheToNumber,
  promptCache,
  promptRequest,
  raiseError,
  selectData,
  setCache,
  withCache,
} from "../libs/scenario";
*/
export const router = Router();

router.post(
  "/login",
  defineScenario(
    extractBody({ code: "" }),
    setData<DB["user"], { body: { code: string } }>((f) =>
      dbFindOne<DB["user"]>("user")({ email: f.context.body.code })(db()),
    ),
    cutData("_id"),
  ),
);

router.post(
  "/testLogin",
  defineScenario(
    extractBody({ email: "" }),
    setData<UserLoggedIn | UserNeedRegister, { body: { email: string } }>(
      async (f) => {
        const result = await dbFindOne<Schema["user"]>("user")({
          platformType: "TEST",
          email: f.context.body.email,
        })(db());
        if (isErrorReport(result)) {
          return { needRegister: true, email: f.context.body.email };
        }
        const token = sign({ type: "user", _id: result._id }, "testSecret");
        return toUserLoggedIn(result, token);
      },
    ),
  ),
);

router.post(
  "/testRegister",
  defineScenario(
    extractRequest({
      params: [],
      query: ["access_token"],
      headers: [],
    } as const),
    extractBody({ email: "", name: "", phoneNumber: "" }),
    checkFlow<{ body: { email: string } }>(async (f) => {
      const alreadyExist = await dbFindOne<Schema["user"]>("user")({
        platformType: "TEST",
        email: f.context.body.email,
      })(db());
      if (!isErrorReport(alreadyExist)) {
        return raiseSimpleError(500, "이미 존재하는 유저입니다");
      }
    }),
    setContext<
      UserRegisterForm,
      {
        body: { email: string; name: string; phoneNumber: string };
        access_token: string;
      }
    >(({ context: { body, access_token } }) => ({ ...body, access_token }))(
      "registerForm",
    ),
    setData<UserLoggedIn, { registerForm: UserRegisterForm }>(async (f) => {
      const { name, phoneNumber, email } = f.context.registerForm;
      const newUser = prepareNewUser({
        name,
        phoneNumber,
        email,
        socialId: "test",
      });
      const id = await dbInsertOne<Schema["user"]>("user")(newUser)(db());
      if (isErrorReport(id)) {
        return raiseScenarioErrorWithReport(id)(f);
      }
      const token = sign({ type: "user", _id: id }, "testSecret");
      return toUserLoggedIn(newUser, token);
    }),
  ),
);

router.post(
  "/autoLogin",
  defineScenario(
    extractRequest({
      headers: ["authorization"],
      params: [],
      query: [],
    } as const),
    authorizeUser,
    setData<
      UserLoggedIn,
      { authorization: string; authedUser: Schema["user"] }
    >((f) => toUserLoggedIn(f.context.authedUser, f.context.authorization)),
  ),
);

/* 
router.post(  
  "/login",
  defineScenario(
    extractRequest({ body: ["code"] }),
    mapCache((cache) => ({ email: cache.code })),
    withCache(findOne)("user"),
    selectData("user"),
  ),
);

router.post(
  "/autoLogin",
  defineScenario(
    extractRequest({ body: ["id"] }),
    parseCacheToNumber("id"),
    withCache(findOne)("user"),
    selectData("user"),
  ),
);

router.get(
  "/ownedCreator",
  defineScenario(
    extractRequest({ headers: ["authorization"] }),
    promptCache,
    parseCacheToNumber("authorization"),
    mapCache((cache) => ({ id: cache.authorization })),
    withCache(findOne)("user"),
    (flow) => setCache({ id: { $in: flow.data.user.ownedCreators } })(flow),
    withCache(findAll)("creator"),
    selectData("creators"),
  ),
);
*/
export default router;
