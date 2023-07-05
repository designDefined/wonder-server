import { Router } from "express";
import db from "../db/connect";
import { UserDB } from "../types/user";
import {
  Creator,
  CreatorDB,
  CreatorDetail,
  NewCreator,
} from "../types/creator";
import { unique } from "../functions/uniqueId";
import { DateInformation, StoredImage } from "../types/utility";
import { WonderDB, WonderSummaryTitleOnly } from "../types/wonder";
import defineScenario from "../libs/flow/express";
import {
  checkFlow,
  extractBody,
  extractRequest,
  isErrorReport,
  mapData,
  parseContextToInt,
  raiseScenarioError,
  raiseScenarioErrorWithReport,
  raiseSimpleError,
  setContext,
  setData,
} from "../libs/flow";
import { authorizeUser, authorizeUserLenient } from "../functions/auth";
import {
  dbFind,
  dbFindOne,
  dbInsertOne,
  dbUpdateOne,
} from "../libs/flow/mongodb";
import { DB, Schema } from "../types/db";
import { prepareNewCreator } from "../functions/creator";
import {
  isValidCreatorName,
  isValidCreatorSummary,
  isValidInstagram,
} from "../functions/validator";
import { toWonderSummaryTitleOnly } from "../functions/wonder";

const router = Router();

router.get(
  "/:creatorId",
  defineScenario(
    extractRequest({
      params: ["creatorId"],
      query: [],
      headers: [],
    } as const),
    authorizeUserLenient,
    parseContextToInt("creatorId"),
    setData<DB["creator"], { creatorId: number }>((f) =>
      dbFindOne<Schema["creator"]>("creator")({ id: f.context.creatorId })(
        db(),
      ),
    ),
    setData<
      CreatorDetail,
      { authedUser: DB["user"] | "no_user" },
      DB["creator"]
    >(({ context, data }) => ({
      id: data.id,
      name: data.name,
      summary: data.summary,
      profileImage: data.profileImage,
      instagram: data.instagram,
      isMine:
        context.authedUser !== "no_user" &&
        data.owner.equals(context.authedUser._id),
    })),
  ),
);

router.get(
  "/:creatorId/wonders",
  defineScenario(
    extractRequest({
      params: ["creatorId"],
      query: [],
      headers: [],
    } as const),
    authorizeUserLenient,
    parseContextToInt("creatorId"),
    setContext<DB["creator"], { creatorId: number }>((f) =>
      dbFindOne<Schema["creator"]>("creator")({ id: f.context.creatorId })(
        db(),
      ),
    )("creator"),
    setData<DB["wonder"][], { creator: DB["creator"] }>((f) =>
      dbFind<DB["wonder"]>("wonder")({
        id: { $in: f.context.creator.createdWonder },
      })(db()),
    ),
    mapData<WonderSummaryTitleOnly[], Record<string, any>, DB["wonder"][]>(
      toWonderSummaryTitleOnly,
    ),
  ),
);

router.post(
  "/new",
  defineScenario(
    extractRequest({
      params: [],
      query: [],
      headers: ["authorization"],
    } as const),
    extractBody<NewCreator>({ name: "", summary: "", instagram: "" }),
    authorizeUser,
    checkFlow<{ body: NewCreator }>((f) => {
      const { name, summary, instagram } = f.context.body;
      const errors: string[] = [];
      if (!isValidCreatorName(name)) errors.push("크리에이터 명");
      if (!isValidCreatorSummary(summary)) errors.push("크리에이터 소개");
      if (instagram && !isValidInstagram(instagram))
        errors.push("인스타그램 계정");
      if (errors.length > 0) {
        return raiseSimpleError(
          500,
          `${errors.join(", ")}이(가) 올바르지 않습니다`,
        );
      }
    }),
    setContext<Schema["creator"], { authedUser: DB["user"]; body: NewCreator }>(
      (f) => {
        return prepareNewCreator(f.context.body, f.context.authedUser._id);
      },
    )("newCreator"),
    setData<
      { createdId: DB["creator"]["_id"]; isSuccess: boolean },
      { newCreator: Schema["creator"]; authedUser: DB["user"] }
    >(async (f) => {
      const id = await dbInsertOne<Schema["creator"]>("creator")(
        f.context.newCreator,
      )(db());
      const updatedUser = await dbUpdateOne<DB["user"]>("user")(
        {
          _id: f.context.authedUser._id,
        },
        { $push: { ownedCreators: f.context.newCreator.id } },
      )(db());
      if (isErrorReport(updatedUser))
        return raiseScenarioErrorWithReport(updatedUser)(f);
      if (isErrorReport(id)) return raiseScenarioErrorWithReport(id)(f);
      return { isSuccess: true, createdId: id };
    }),
  ),
);
/* 
router.get("/:creatorId", async (req, res) => {
  const creatorId: string = req.params.creatorId;
  if (!creatorId) {
    res.json({ error: "creatorId is null" });
    return;
  }

  if (db()) {
    const idToFind = parseInt(creatorId);
    const creator = (await db()
      ?.collection<CreatorDB>("creator")
      .findOne({ id: idToFind })) as CreatorDB;
    if (!creator) {
      res.json({ error: "can't find creator" });
      return;
    }
    const wonders = await db()
      ?.collection<WonderDB>("wonder")
      .find(
        { id: { $in: creator.createdWonder } },
        { projection: { id: 1, title: 1, thumbnail: 1 } },
      )
      .toArray();
    res.json({ creator, wonders });
  }
});

router.post("/new", async (req, res) => {
  const { name, summary, instagram, userId } = req.body as {
    name: string;
    summary: string;
    instagram?: string;
    userId: string;
  };

  if (db()) {
    const user = (await db()
      ?.collection<UserDB>("user")
      .findOne(
        { id: userId },
        { projection: { _id: 1, ownedCreator: 1 } },
      )) as { _id: string; ownedCreator: number[] };
    if (!user) {
      res.status(401).json({ error: "can't find user" });
      return;
    }
    const id = unique.creatorId();

    const date: DateInformation = {
      createdAt: new Date(),
      lastModifiedAt: new Date(),
    };
    const image: StoredImage = { src: "", altText: "" };

    const result = await db()
      ?.collection<Creator>("creator")
      .insertOne({
        id: id,
        owner: user._id,
        name: name,
        summary: summary,
        profileImage: {
          src: "/src/assets/sample/creator_thumbnail_sample_1.png",
          altText: "",
        },
        dateInformation: date,
        createdWonder: [],
        instagram: instagram ? instagram : "",
      });
    const result2 = await db()
      ?.collection<UserDB>("user")
      .updateOne(
        { _id: user._id },
        {
          $push: { ownedCreators: id },
        },
      );
    res.json({ isSuccess: true, createdId: id });
  } else {
    res.status(401).json({ error: "db is null" });
  }
});

*/
export default router;
