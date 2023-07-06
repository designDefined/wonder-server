import { verify } from "jsonwebtoken";
import db from "../db/connect";
import {
  setContext,
  raiseScenarioError,
  isErrorReport,
  raiseScenarioErrorWithReport,
} from "../libs/flow";
import { dbFindOne } from "../libs/flow/mongodb";
import { DB, Schema } from "../types/db";
import { ObjectId } from "mongodb";
import { HeaderKeys } from "../libs/flow/types";

export const emptyHeader = [] as HeaderKeys[];
export const authedHeader = ["authorization"] as HeaderKeys[];

export const authorizeUser = setContext<DB["user"], { authorization: string }>(
  (f) => {
    try {
      const result = verify(f.context.authorization, "testSecret") as {
        type: string;
        _id: string;
      };
      const userId = new ObjectId(result._id);
      if (result.type !== "user")
        return raiseScenarioError(500, "유저 토큰이 아닙니다")(f);
      const user = dbFindOne<Schema["user"]>("user")({ _id: userId })(db());
      return isErrorReport(user) ? raiseScenarioErrorWithReport(user)(f) : user;
    } catch (e) {
      console.log(e);
      return raiseScenarioError(500, "토큰이 유효하지 않습니다")(f);
    }
  },
)("authedUser");

export const authorizeUserLenient = setContext<DB["user"] | "no_user">((f) => {
  if (!f.req.headers.authorization) return "no_user";
  try {
    const { type, _id } = verify(f.req.headers.authorization, "testSecret") as {
      type: string;
      _id: string;
    };
    const userId = new ObjectId(_id);
    if (type !== "user") return "no_user";
    const user = dbFindOne<Schema["user"]>("user")({ _id: userId })(db());
    return isErrorReport(user) ? "no_user" : user;
  } catch (e) {
    return "no_user";
  }
})("authedUser");
