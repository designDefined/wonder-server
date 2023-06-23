import { Router } from "express";
import defineScenario, { appendData, findOne } from "../libs/scenario";

const router = Router();

router.get("/", (req, res) => {
  res.send("Wonder Server!!!!");
});

router.get("/ping", defineScenario(appendData({ message: "pong" })));

router.post("/echo", (req, res) => {
  res.json(req.body);
});

router.get("/db", defineScenario(findOne("user", { name: "테스트" })));

export default router;
