import { Router } from "express";
import defineScenario from "../libs/flow/express";
import { extractBodyLenient, setData } from "../libs/flow";

const router = Router();

router.get("/", defineScenario(setData<string>(() => "Wonder Server!!!")));
router.get("/health", defineScenario(setData<boolean>(() => true)));

router.get(
  "/ping",
  defineScenario(setData<{ message: "pong" }>(() => ({ message: "pong" }))),
);

router.post(
  "/echo",
  defineScenario(
    extractBodyLenient<unknown>(),
    setData<unknown, { body: unknown }>((f) => f.context.body),
  ),
);

export default router;
