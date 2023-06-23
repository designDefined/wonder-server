import express, { Router } from "express";
import db from "../db/connect";
import { UserDB, UserDisplaySimple } from "../types/user";
import { CreatorDB, CreatorDisplay } from "../types/creator";

export const router = Router();

router.post("/login", async (req, res) => {
  const { code } = req.body;
  if (db()) {
    if (code === "test") {
      const user = await db()
        ?.collection<UserDB>("user")
        .findOne(
          { id: 0 },
          {
            projection: {
              id: 1,
              name: 1,
              nickname: 1,
              profileImage: 1,
            },
          },
        );
      if (!user) {
        res.status(401).json({ error: "can't find user" });
        return;
      }
      res.json(user as UserDisplaySimple);
    } else {
      res.json({
        error: `unidentified code: ${code}`,
        echo: req.body,
      });
    }
  } else {
    res.status(401).json({ error: "db is null" });
  }
});

router.get("/ownedCreator", async (req, res) => {
  const { userId } = req.query;

  if (db()) {
    const user = (await db()
      ?.collection<UserDB>("user")
      .findOne({ id: userId })) as UserDB;

    if (!user) {
      res.status(401).json({ error: "can't find user" });
      return;
    }

    const creators = (await db()
      ?.collection<CreatorDB>("creator")
      .find(
        { id: { $in: user.ownedCreators } },
        { projection: { id: 1, name: 1, profileImage: 1 } },
      )
      .toArray()) as CreatorDisplay[];
    if (!creators) {
      res.status(401).json({ error: "can't find creators" });
      return;
    }
    res.json(creators);
  } else {
    res.json({ error: "db is null" });
  }
});

export default router;
