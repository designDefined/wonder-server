import { Router } from "express";
import db from "../db/connect";
import {
  Wonder,
  WonderCardDisplay,
  WonderDB,
  WonderView,
} from "../types/wonder";
import { CreatorDB, CreatorDisplay } from "../types/creator";
import { unique } from "../functions/uniqueId";

const router = Router();

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

export default router;
