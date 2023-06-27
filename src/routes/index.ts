import { Router } from "express";
import defineScenario, {
  appendData,
  echo,
  findOne,
  promptRequest,
  setData,
} from "../libs/scenario";

const router = Router();

router.get("/", defineScenario(setData("Wonder Server!!!")));

router.get("/ping", defineScenario(appendData({ message: "pong" })));

router.post("/echo", defineScenario(echo));

router.post(
  "/reqTest/:firstId/and/:secondId",
  defineScenario(promptRequest, echo),
);

router.get("/db", defineScenario(findOne("user", { name: "테스트" })));

export default router;
