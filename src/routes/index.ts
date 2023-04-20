import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.send("Wonder Server!!!!");
});

router.get("/ping", (req, res) => {
  res.send("pong");
});

router.post("/echo", (req, res) => {
  console.dir(req.body);
  res.json(req.body);
});

export default router;
