import { Router } from "express";
import db from "../db/connect";
import { WonderCardDisplay, WonderDB, WonderView } from "../types/wonder";
import { CreatorDB, CreatorDisplay } from "../types/creator";

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
    res.json({ error: "wonderId is null" });
    return null;
  }
  if (db()) {
    const idToFind = parseInt(wonderId);
    const wonder = await db()
      ?.collection<WonderDB>("wonder")
      .findOne({ id: idToFind });

    if (!wonder) {
      res.json({ error: "can't find wonder" });
      return null;
    }
    const creator = (await db()
      ?.collection<CreatorDB>("creator")
      .findOne(
        { _id: wonder.creator },
        { projection: { id: 1, name: 1, profileImage: 1 } },
      )) as CreatorDisplay;

    if (!creator) {
      res.json({ error: "can't find creator" });
      return null;
    }
    const data = { ...wonder, creator };
    res.json(data);
  } else {
    res.json({ error: "db is null" });
  }
});

export default router;
