import { Router } from "express";
import defineScenario from "../libs/flow/express";
import {
  checkFlow,
  cutData,
  extractBody,
  extractRequest,
  isErrorReport,
  mapData,
  promptFlow,
  raiseScenarioErrorWithReport,
  raiseSimpleError,
  setContext,
  setData,
} from "../libs/flow";
import {
  dbFind,
  dbFindLastOne,
  dbFindOne,
  dbInsertOne,
} from "../libs/flow/mongodb";
import db from "../db/connect";
import { DB, Schema } from "../types/db";
import {
  UserLoggedIn,
  UserNeedRegister,
  UserRegisterForm,
  UserWithEmail,
} from "../types/user";
import { sign, verify } from "jsonwebtoken";
import {
  prepareNewUser,
  toUserLoggedIn,
  toUserWithEmail,
} from "../functions/user";
import { ObjectId } from "mongodb";
import { authorizeUser } from "../functions/auth";
import {
  isValidRegisterEmail,
  isValidRegisterName,
  isValidRegisterPhoneNumber,
} from "../functions/validator";
import { OwnedCreator } from "../types/creator";
import { toOwnedCreator } from "../functions/creator";
import {
  MyWonderSummary,
  WonderSummaryReservation,
  WonderSummaryTitleOnly,
} from "../types/wonder";
import { getWonderFromReservation } from "../functions/reservation";
import {
  toWonderSummaryReservation,
  toWonderSummaryTitleOnly,
} from "../functions/wonder";
import { deleteNull } from "../functions/utility";
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
    checkFlow<{ body: { email: string; name: string; phoneNumber: string } }>(
      (f) => {
        const { email, name, phoneNumber } = f.context.body;
        const errors: string[] = [];
        if (!isValidRegisterEmail(email)) errors.push("이메일");
        if (!isValidRegisterName(name)) errors.push("이름");
        if (!isValidRegisterPhoneNumber(phoneNumber)) errors.push("전화번호");
        if (errors.length > 0) {
          return raiseSimpleError(
            500,
            `${errors.join(", ")}이(가) 올바르지 않습니다`,
          );
        }
      },
    ),
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

router.get(
  "/ownedCreator",
  defineScenario(
    extractRequest({
      headers: ["authorization"],
      params: [],
      query: [],
    } as const),
    authorizeUser,
    setData<DB["creator"][], { authedUser: DB["user"] }>((f) =>
      dbFind<DB["creator"]>("creator")({
        id: { $in: f.context.authedUser.ownedCreators },
      })(db()),
    ),
    mapData<OwnedCreator[], Record<string, any>, DB["creator"][]>(
      toOwnedCreator,
    ),
  ),
);

router.get(
  "/myDetail",
  defineScenario(
    extractRequest({
      headers: ["authorization"],
      params: [],
      query: [],
    } as const),
    authorizeUser,
    setData<DB["user"], { authedUser: DB["user"] }>((f) =>
      dbFindOne<DB["user"]>("user")({ _id: f.context.authedUser._id })(db()),
    ),
    setData<UserWithEmail, Record<string, any>, DB["user"]>(({ data }) =>
      toUserWithEmail(data),
    ),
  ),
);

router.get(
  "/myWonderSummary",
  defineScenario(
    extractRequest({
      headers: ["authorization"],
      params: [],
      query: [],
    } as const),
    authorizeUser,
    setData<MyWonderSummary, { authedUser: DB["user"] }>(async (f) => {
      const data: MyWonderSummary = {
        liked: null,
        reserved: null,
        ticketBook: null,
      };
      const liked = await dbFindLastOne<DB["wonder"]>("wonder")({
        id: { $in: f.context.authedUser.likedWonders },
      })(db());
      data.liked = isErrorReport(liked) ? null : liked;
      const reserved = await dbFindLastOne<DB["reservation"]>("reservation")({
        id: { $in: f.context.authedUser.reservedWonders },
      })(db());
      if (!isErrorReport(reserved)) {
        const reservedWonder = await getWonderFromReservation(reserved);
        data.reserved = isErrorReport(reservedWonder)
          ? null
          : toWonderSummaryReservation(reservedWonder, reserved.time);
      }
      const ticketBook = await dbFindLastOne<DB["reservation"]>("reservation")({
        id: { $in: f.context.authedUser.ticketBook },
      })(db());
      if (!isErrorReport(ticketBook)) {
        const ticketBookWonder = await getWonderFromReservation(ticketBook);
        data.ticketBook = isErrorReport(ticketBookWonder)
          ? null
          : toWonderSummaryReservation(ticketBookWonder, ticketBook.time);
      }
      return data;
    }),
  ),
);

router.get(
  "/liked",
  defineScenario(
    extractRequest({
      headers: ["authorization"],
      params: [],
      query: [],
    } as const),
    authorizeUser,

    setData<DB["wonder"][], { authedUser: DB["user"] }>((f) =>
      dbFind<DB["wonder"]>("wonder")({
        id: { $in: f.context.authedUser.likedWonders },
      })(db()),
    ),
    mapData<WonderSummaryTitleOnly[], Record<string, any>, DB["wonder"][]>(
      toWonderSummaryTitleOnly,
    ),
  ),
);

router.get(
  "/reserved",
  defineScenario(
    extractRequest({
      headers: ["authorization"],
      params: [],
      query: [],
    } as const),
    authorizeUser,
    setData<DB["reservation"][], { authedUser: DB["user"] }>((f) =>
      dbFind<DB["reservation"]>("reservation")({
        id: { $in: f.context.authedUser.reservedWonders },
      })(db()),
    ),
    mapData<
      (WonderSummaryReservation | null)[],
      Record<string, any>,
      DB["reservation"][]
    >(async (data) => {
      const wonder = await getWonderFromReservation(data);
      if (isErrorReport(wonder)) return null;
      return toWonderSummaryReservation(wonder, data.time);
    }),
    setData<
      WonderSummaryReservation[],
      Record<string, any>,
      (WonderSummaryReservation | null)[]
    >((f) => deleteNull(f.data)),
  ),
);

router.get(
  "/ticketBook",
  defineScenario(
    extractRequest({
      headers: ["authorization"],
      params: [],
      query: [],
    } as const),
    authorizeUser,

    setData<DB["reservation"][], { authedUser: DB["user"] }>((f) =>
      dbFind<DB["reservation"]>("reservation")({
        id: { $in: f.context.authedUser.ticketBook },
      })(db()),
    ),
    mapData<
      (WonderSummaryReservation | null)[],
      Record<string, any>,
      DB["reservation"][]
    >(async (data) => {
      const wonder = await getWonderFromReservation(data);
      if (isErrorReport(wonder)) return null;
      return toWonderSummaryReservation(wonder, data.time);
    }),
    setData<
      WonderSummaryReservation[],
      Record<string, any>,
      (WonderSummaryReservation | null)[]
    >((f) => deleteNull(f.data)),
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
