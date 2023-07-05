import { Router } from "express";
import db from "../db/connect";
import { NewWonder, Wonder, WonderCard, WonderDetail } from "../types/wonder";
import { CreatorDB } from "../types/creator";
import { unique } from "../functions/uniqueId";
import defineScenario from "../libs/flow/express";
import {
  extractRequest,
  isErrorReport,
  mapData,
  parseContextToInt,
  promptWithFlag,
  setData,
  setContext,
  checkFlow,
  extractBody,
  raiseScenarioError,
  raiseScenarioErrorWithReport,
  extractBodyLenient,
} from "../libs/flow";
import {
  dbFind,
  dbFindOne,
  dbInsertOne,
  dbUpdateOne,
} from "../libs/flow/mongodb";
import { DB, Schema } from "../types/db";
import {
  prepareNewWonder,
  toWonderCard,
  toWonderDetail,
} from "../functions/wonder";
import {
  toCreatorInWonderCard,
  toCreatorInWonderDetail,
} from "../functions/creator";
import { authorizeUser, authorizeUserLenient } from "../functions/auth";
import { UpdateFilter } from "mongodb";
import { deleteNull } from "../functions/utility";
import {
  isValidWonderLocation,
  isValidWonderSchedule,
  isValidWonderTitle,
} from "../functions/validator";

const router = Router();

router.get(
  "/recent",
  defineScenario(
    setData<DB["wonder"][]>(() => dbFind<Schema["wonder"]>("wonder")()(db())),
    mapData<(WonderCard | null)[], Record<string, any>, DB["wonder"][]>(
      async (wonder) => {
        const creator = await dbFindOne<Schema["creator"]>("creator")({
          _id: wonder.creator,
        })(db());
        return isErrorReport(creator)
          ? null
          : toWonderCard(wonder, toCreatorInWonderCard(creator));
      },
    ),
    setData<WonderCard[], Record<string, any>, (WonderCard | null)[]>((f) =>
      deleteNull(f.data),
    ),
  ),
);

router.get(
  "/:wonderId",
  defineScenario(
    extractRequest({
      params: ["wonderId"],
      query: [],
      headers: [],
    } as const),
    authorizeUserLenient,
    parseContextToInt("wonderId"),
    setData<DB["wonder"], { wonderId: number }>((f) =>
      dbFindOne<Schema["wonder"]>("wonder")({ id: f.context.wonderId })(db()),
    ),
    setData<WonderDetail, { authedUser: DB["user"] | "no_user" }, DB["wonder"]>(
      async ({ context, data }) => {
        const me = context.authedUser;
        const creator = await dbFindOne<Schema["creator"]>("creator")({
          _id: data.creator,
        })(db());
        console.log(me !== "no_user" && data.likedUsers.includes(me.id));
        return isErrorReport(creator)
          ? creator
          : toWonderDetail(
              data,
              toCreatorInWonderDetail(creator),
              me !== "no_user" && data.likedUsers.includes(me.id),
              false,
            );
      },
    ),
  ),
);

router.put(
  "/:wonderId/like",
  defineScenario(
    extractRequest({
      params: ["wonderId"],
      query: [],
      headers: ["authorization"],
    } as const),
    extractBody<{ value: boolean }>({ value: true }),
    authorizeUser,
    parseContextToInt("wonderId"),
    setContext<DB["wonder"], { wonderId: number }>((f) =>
      dbFindOne<Schema["wonder"]>("wonder")({ id: f.context.wonderId })(db()),
    )("wonder"),
    setData<
      { likeIsNow: boolean },
      { wonder: DB["wonder"]; authedUser: DB["user"]; body: { value: boolean } }
    >(async (f) => {
      const {
        wonder,
        authedUser: user,
        body: { value },
      } = f.context;
      const wonderQuery = value
        ? { $push: { likedUsers: user.id } }
        : { $pull: { likedUsers: user.id } };
      const userQuery = value
        ? { $push: { likedWonders: wonder.id } }
        : { $pull: { likedWonders: wonder.id } };
      const wonderUpdateResult = await dbUpdateOne<DB["wonder"]>("wonder")(
        {
          _id: wonder._id,
        },
        wonderQuery,
      )(db());
      const userUpdateResult = await dbUpdateOne<DB["user"]>("user")(
        {
          _id: user._id,
        },
        userQuery,
      )(db());
      if (isErrorReport(wonderUpdateResult)) return wonderUpdateResult;
      if (isErrorReport(userUpdateResult)) return userUpdateResult;
      return { likeIsNow: value };
    }),
  ),
);

router.post(
  "/new/:creatorId",
  defineScenario(
    extractRequest({
      params: ["creatorId"],
      query: [],
      headers: ["authorization"],
    } as const),
    extractBodyLenient<NewWonder>(),
    authorizeUser,
    parseContextToInt("creatorId"),
    setContext<
      Schema["wonder"],
      { authedUser: DB["user"]; creatorId: number; body: NewWonder }
    >(async (f) => {
      const creator = await dbFindOne<Schema["creator"]>("creator")({
        id: f.context.creatorId,
      })(db());
      if (isErrorReport(creator)) return creator;
      if (creator.owner.equals(f.context.authedUser._id) === false)
        return raiseScenarioError(402, "권한이 없는 크리에이터입니다.")(f);
      const { title, schedule, location } = f.context.body;

      if (!isValidWonderTitle(title))
        return raiseScenarioError(402, "제목이 유효하지 않습니다.")(f);
      if (!isValidWonderSchedule(schedule))
        return raiseScenarioError(402, "일정이 유효하지 않습니다.")(f);
      if (!isValidWonderLocation(location))
        return raiseScenarioError(402, "장소가 유효하지 않습니다.")(f);

      return prepareNewWonder(f.context.body, creator._id);
    })("newWonder"),
    setData<
      { isSuccess: boolean; createdId: DB["wonder"]["_id"] },
      { creatorId: DB["creator"]["_id"]; newWonder: Schema["wonder"] }
    >(async (f) => {
      const result1 = await dbInsertOne<Schema["wonder"]>("wonder")(
        f.context.newWonder,
      )(db());
      if (isErrorReport(result1)) return result1;
      const result2 = await dbUpdateOne<DB["creator"]>("creator")(
        { _id: f.context.creatorId },
        { $push: { createdWonder: f.context.newWonder.id } },
      )(db());
      if (isErrorReport(result2)) return result2;
      return { isSuccess: true, createdId: result1 };
    }),
  ),
);

/* 
router.get("/recent", async (req, res) => {
  if (db()) {
    const wonders = await db()
      ?.collection<WonderDB>("wonder")
      .find(
        {},
        { projection: { id: 1, title: 1, tags: 1, thumbnail: 1, creator: 1 } },
      )
      .limit(5)
      .toArray();
    const data: WonderCardDisplay[] = [];
    for (const wonder of wonders) {
      const mappedWonder = wonder as Pick<
        WonderDB,
        "id" | "title" | "tags" | "thumbnail" | "creator"
      >;
      const creator = (await db()
        ?.collection<CreatorDB>("creator")
        .findOne(
          { _id: mappedWonder.creator },
          { projection: { id: 1, name: 1, profileImage: 1 } },
        )) as CreatorDisplay;
      data.push({ ...mappedWonder, creator });
    }
    res.json(data);
  } else {
    res.json({ error: "db is null" });
  }
});
router.get("/:wonderId", async (req, res) => {
  const wonderId: string = req.params.wonderId;
  if (!wonderId) {
    res.status(500).json({ error: "wonderId is null" });
    return null;
  }
  if (db()) {
    const idToFind = parseInt(wonderId);
    const wonder = await db()
      ?.collection<WonderDB>("wonder")
      .findOne({ id: idToFind });

    if (!wonder) {
      res.status(500).json({ error: "can't find wonder" });
      return null;
    }
    const creator = (await db()
      ?.collection<CreatorDB>("creator")
      .findOne(
        { _id: wonder.creator },
        { projection: { id: 1, name: 1, profileImage: 1 } },
      )) as CreatorDisplay;

    if (!creator) {
      res.status(500).json({ error: "can't find creator" });
      return null;
    }
    const data = { ...wonder, creator };
    res.json(data);
  } else {
    res.status(500).json({ error: "db is null" });
  }
});


router.post("/new", async (req, res) => {
  const wonderData = req.body.wonder;
  const creatorId = Number(req.headers.authorization);

  if (db()) {
    const creator = await db()
      ?.collection<CreatorDB>("creator")
      .findOne({ id: creatorId });

    if (!creator) {
      res.status(500).json({ error: "can't find creator" });
      return null;
    }
    const id = unique.wonderId();
    const result = await db()
      ?.collection<Wonder>("wonder")
      .insertOne({
        ...wonderData,
        id: id,
        creator: creator._id,
        dateInformation: {
          createdAt: new Date(),
          lastModifiedAt: new Date(),
        },
      });
    const result2 = await db()
      ?.collection<CreatorDB>("creator")
      .updateOne({ _id: creator._id }, { $push: { createdWonder: id } });
    res.json({ isSuccess: true, createdId: id });
  } else {
    res.status(500).json({ error: "db is null" });
  }
});
*/
export default router;
