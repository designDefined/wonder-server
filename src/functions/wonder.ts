import { CreatorInWonderCard, CreatorInWonderDetail } from "../types/creator";
import { DB, Schema } from "../types/db";
import { Reservation } from "../types/reservation";
import {
  NewWonder,
  Wonder,
  WonderCard,
  WonderDetail,
  WonderSummaryReservation,
  WonderSummaryTitleOnly,
} from "../types/wonder";
import { unique } from "./uniqueId";

export const toWonderCard = (
  wonder: Wonder | DB["wonder"],
  creator: CreatorInWonderCard,
): WonderCard => ({
  id: wonder.id,
  title: wonder.title,
  thumbnail: wonder.thumbnail,
  creator,
});

export const toWonderDetail = (
  wonder: Wonder | DB["wonder"],
  creator: CreatorInWonderDetail,
  liked: boolean,
  reserved: boolean,
): WonderDetail => ({
  id: wonder.id,
  title: wonder.title,
  thumbnail: wonder.thumbnail,
  tags: wonder.tags,
  summary: wonder.summary,
  content: wonder.content,
  schedule: wonder.schedule,
  location: wonder.location,
  dateInformation: wonder.dateInformation,
  reservationProcess: wonder.reservationProcess,
  creator,
  liked,
  reserved,
});

export const toWonderSummaryTitleOnly = (
  wonder: Wonder | DB["wonder"],
): WonderSummaryTitleOnly => ({
  id: wonder.id,
  title: wonder.title,
  thumbnail: wonder.thumbnail,
});

export const toWonderSummaryReservation = (
  wonder: Wonder | DB["wonder"],
  time: Reservation["time"],
): WonderSummaryReservation => ({
  id: wonder.id,
  title: wonder.title,
  thumbnail: wonder.thumbnail,
  location: wonder.location,
  reservedTime: time,
});

const primaryTag: string[] = [];
export const prepareWonderTag = (input: string[]): Wonder["tags"] =>
  input.map((tag) =>
    primaryTag.includes(tag)
      ? { isPrimary: true, value: tag }
      : { isPrimary: false, value: tag },
  );

export const prepareNewWonder = (
  wonder: NewWonder,
  creatorId: DB["creator"]["_id"],
): Schema["wonder"] => ({
  id: unique.wonderId(),
  title: wonder.title,
  tags: prepareWonderTag(wonder.tags),
  thumbnail: wonder.thumbnail,
  creator: creatorId,
  summary: wonder.summary,
  content: wonder.content,
  schedule: wonder.schedule,
  location: wonder.location,
  dateInformation: {
    createdAt: new Date(),
    lastModifiedAt: new Date(),
  },
  reservationProcess: wonder.reservationProcess,
  likedUsers: [],
  reservations: [],
});
