import { Router } from "express";

export const router = Router();

router.get("/", (req, res) => {
  res.send("sample router!");
});

router.get("/asdf", (req, res) => {
  res.send("abc");
});
export default router;
