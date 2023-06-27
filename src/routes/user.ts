import { Router } from "express";

import defineScenario, {
  extractRequest,
  findAll,
  findOne,
  mapCache,
  parseCacheToNumber,
  raiseError,
  selectData,
  setCache,
  withCache,
} from "../libs/scenario";

export const router = Router();

router.post(
  "/login",
  defineScenario(
    extractRequest({ body: ["code"] }),
    (flow) =>
      flow.cache.code === "test"
        ? setCache({ id: "0" })(flow)
        : raiseError("등록되지 않은 테스트 코드입니다", 401)(flow),
    parseCacheToNumber("id"),
    withCache(findOne)("user"),
    selectData("user"),
  ),
);

router.get(
  "/ownedCreator",
  defineScenario(
    extractRequest({ query: ["userId"] }),
    parseCacheToNumber("userId"),
    mapCache((cache) => ({ id: cache.userId })),
    withCache(findOne)("user"),
    (flow) => setCache({ id: { $in: flow.data.user.ownedCreators } })(flow),
    withCache(findAll)("creator"),
    selectData("creators"),
  ),
);

export default router;
