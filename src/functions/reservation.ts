import db from "../db/connect";
import { dbFindOne } from "../libs/flow/mongodb";
import { FlowErrorReport } from "../libs/flow/types";
import { DB, Schema } from "../types/db";
import { NewReservation, Reservation } from "../types/reservation";
import { unique } from "./uniqueId";

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

const prepareNewReservationData = (
  newReservation: NewReservation,
  user: DB["user"],
): Schema["reservation"]["data"] => {
  const data: Schema["reservation"]["data"] = {
    wonderId: newReservation.wonderId,
    userId: newReservation.userId,
  };
  newReservation.data.forEach((key) => {
    data[key] = user[key];
  });
  return data;
};

export const prepareNewReservation = (
  { wonderId, userId, time, data }: NewReservation,
  wonder: DB["wonder"],
  user: DB["user"],
): Schema["reservation"] => ({
  id: unique.reservationId(),
  wonder: wonder._id,
  user: user._id,
  time,
  data: prepareNewReservationData({ wonderId, userId, time, data }, user),
  dateInformation: {
    createdAt: new Date(),
    lastModifiedAt: new Date(),
  },
});
