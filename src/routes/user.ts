import { Router } from "express";
import defineScenario from "../libs/flow/express";
import {
  cutData,
  extractBody,
  extractRequest,
  promptWithFlag,
  setData,
} from "../libs/flow";
import { dbFindOne } from "../libs/flow/mongodb";
import db from "../db/connect";
import { DB } from "../types/db";
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
    promptWithFlag("abc"),
    setData<DB["user"], { body: { code: string } }>((f) =>
      dbFindOne<DB["user"]>("user")({ email: f.context.body.code })(db()),
    ),
    cutData("_id"),
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
