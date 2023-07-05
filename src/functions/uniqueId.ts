import db from "../db/connect";
import { isErrorReport } from "../libs/flow";
import { dbFindLastOne } from "../libs/flow/mongodb";
import { Schema } from "../types/db";

let creatorId = -999;
let wonderId = -999;
let userId = -999;

export const unique = {
  creatorId: () => {
    creatorId++;
    return creatorId;
  },
  wonderId: () => {
    wonderId++;
    return wonderId;
  },
  userId: () => {
    userId++;
    return userId;
  },
};

export const initUniqueId = async (): Promise<boolean> => {
  const creator = await dbFindLastOne<Schema["creator"]>("creator")()(db());
  const user = await dbFindLastOne<Schema["user"]>("user")()(db());
  const wonder = await dbFindLastOne<Schema["wonder"]>("wonder")()(db());
  if (isErrorReport(creator) || isErrorReport(user) || isErrorReport(wonder)) {
    console.log("uniqueId initializing failed, retry");
    setTimeout(initUniqueId, 1000);
    return false;
  }
  creatorId = creator.id;
  userId = user.id;
  wonderId = wonder.id;
  console.log("uniqueId initialized");
  console.log(`creator_id: ${creatorId}`);
  console.log(`user_id: ${userId}`);
  console.log(`wonder_id: ${wonderId}`);
  return true;
};
