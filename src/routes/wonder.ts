import { Router } from "express";
import db from "../db/connect";
import {
  NewWonder,
  NewWonderWithRawImage,
  WonderCard,
  WonderDetail,
} from "../types/wonder";

import defineScenario from "../libs/flow/express";
import {
  extractRequest,
  isErrorReport,
  mapData,
  parseContextToInt,
  setData,
  setContext,
  extractBody,
  raiseScenarioError,
  extractBodyLenient,
  promptFlow,
} from "../libs/flow";
import {
  dbFindLastAsManyAs,
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
import {
  authedHeader,
  authorizeUser,
  authorizeUserLenient,
  emptyHeader,
} from "../functions/auth";
import { deleteNull } from "../functions/utility";
import {
  isValidWonderLocation,
  isValidWonderSchedule,
  isValidWonderTitle,
} from "../functions/validator";
import { NewReservation } from "../types/reservation";
import { prepareNewReservation } from "../functions/reservation";
import { uploadThumbnail } from "../functions/aws";
import { unique } from "../functions/uniqueId";

const router = Router();

router.get(
  "/recent",
  defineScenario(
    setData<DB["wonder"][]>(() =>
      dbFindLastAsManyAs<Schema["wonder"]>("wonder")(5)()(db()),
    ),
    mapData<(WonderCard | null)[], object, DB["wonder"][]>(async (wonder) => {
      const creator = await dbFindOne<Schema["creator"]>("creator")({
        _id: wonder.creator,
      })(db());
      return isErrorReport(creator)
        ? null
        : toWonderCard(wonder, toCreatorInWonderCard(creator));
    }),
    setData<WonderCard[], object, (WonderCard | null)[]>((f) =>
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
      headers: emptyHeader,
    } as const),
    promptFlow,

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
      headers: authedHeader,
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
      headers: authedHeader,
    } as const),
    extractBodyLenient<NewWonderWithRawImage>(),
    authorizeUser,
    parseContextToInt("creatorId"),
    setContext<
      Schema["wonder"],
      { authedUser: DB["user"]; creatorId: number; body: NewWonderWithRawImage }
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

      const presignedId = unique.wonderId();
      const presignedThumbnail = await uploadThumbnail(
        f.context.body.thumbnail.file,
        `${presignedId}_${f.context.body.thumbnail.fileName}`,
      );
      if (isErrorReport(presignedThumbnail)) return presignedThumbnail;

      return prepareNewWonder(f.context.body, creator._id, presignedId, {
        src: `${presignedThumbnail}`,
        altText: `${presignedId}_${f.context.body.thumbnail.fileName}`,
      });
    })("newWonder"),
    setData<
      { isSuccess: boolean; createdId: DB["wonder"]["id"] },
      { creatorId: DB["creator"]["id"]; newWonder: Schema["wonder"] }
    >(async (f) => {
      const result1 = await dbInsertOne<Schema["wonder"]>("wonder")(
        f.context.newWonder,
      )(db());
      if (isErrorReport(result1)) return result1;
      const result2 = await dbUpdateOne<DB["creator"]>("creator")(
        { id: f.context.creatorId },
        { $push: { createdWonder: f.context.newWonder.id } },
      )(db());
      if (isErrorReport(result2)) return result2;
      return { isSuccess: true, createdId: f.context.newWonder.id };
    }),
  ),
);

router.post(
  "/:wonderId/reservation",
  defineScenario(
    extractRequest({
      params: ["wonderId"],
      query: [],
      headers: authedHeader,
    } as const),
    extractBody<NewReservation>({
      wonderId: -1,
      userId: -1,
      time: { date: [0, 0, 0], time: [] },
      data: [],
    }),
    authorizeUser,
    parseContextToInt("wonderId"),
    setContext<DB["wonder"], { wonderId: number }>((f) =>
      dbFindOne<Schema["wonder"]>("wonder")({ id: f.context.wonderId })(db()),
    )("wonder"),
    setContext<
      Schema["reservation"],
      { authedUser: DB["user"]; wonder: DB["wonder"]; body: NewReservation }
    >(({ context: { body, authedUser, wonder } }) => {
      return prepareNewReservation(body, wonder, authedUser);
    })("newReservation"),
    setData<
      { isSuccess: boolean; createdId: DB["reservation"]["id"] },
      { newReservation: Schema["reservation"] }
    >(async (f) => {
      const resultReservation = await dbInsertOne<Schema["reservation"]>(
        "reservation",
      )(f.context.newReservation)(db());
      if (isErrorReport(resultReservation)) return resultReservation;

      const resultWonder = await dbUpdateOne<DB["wonder"]>("wonder")(
        { _id: f.context.newReservation.wonder },
        { $push: { reservations: f.context.newReservation.id } },
      )(db());
      if (isErrorReport(resultWonder)) return resultWonder;

      const resultUser = await dbUpdateOne<DB["user"]>("user")(
        { _id: f.context.newReservation.user },
        { $push: { reservedWonders: f.context.newReservation.id } },
      )(db());
      if (isErrorReport(resultUser)) return resultUser;

      return { isSuccess: true, createdId: f.context.newReservation.id };
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
