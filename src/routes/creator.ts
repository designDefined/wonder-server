import { Router } from "express";
import db from "../db/connect";
import { UserDB, UserSummary } from "../types/user";
import { Creator, CreatorDB } from "../types/creator";
import { unique } from "../functions/uniqueId";
import { DateInformation, StoredImage } from "../types/utility";
import { WonderDB } from "../types/wonder";

const router = Router();

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
        profileImage: image,
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

export default router;
