import db from "../db/connect";
import { dbFindOne } from "../libs/flow/mongodb";
import { FlowErrorReport } from "../libs/flow/types";
import { DB } from "../types/db";

export const getWonderFromReservation = (
  reservation: DB["reservation"],
): Promise<DB["wonder"] | FlowErrorReport> =>
  dbFindOne<DB["wonder"]>("wonder")({
    _id: reservation.wonder,
  })(db());

export const getUserFromReservation = (
  reservation: DB["reservation"],
): Promise<DB["user"] | FlowErrorReport> =>
  dbFindOne<DB["user"]>("user")({
    _id: reservation.user,
  })(db());
