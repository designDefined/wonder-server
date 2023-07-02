import { verify } from "jsonwebtoken";
import db from "../db/connect";
import {
  setContext,
  raiseScenarioError,
  isErrorReport,
  raiseScenarioErrorWithReport,
} from "../libs/flow";
import { dbFindOne } from "../libs/flow/mongodb";
import { Schema } from "../types/db";
import { ObjectId } from "mongodb";

export const authorizeUser = setContext<
  Schema["user"],
  { authorization: string }
>((f) => {
  const { type, _id } = verify(f.context.authorization, "testSecret") as {
    type: string;
    _id: ObjectId;
  };
  if (type !== "user")
    return raiseScenarioError(500, "유저 토큰이 아닙니다")(f);
  const user = dbFindOne<Schema["user"]>("user")({ _id })(db());
  return isErrorReport(user) ? raiseScenarioErrorWithReport(user)(f) : user;
})("authedUser");
