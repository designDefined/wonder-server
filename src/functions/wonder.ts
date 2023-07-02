import db from "../db/connect";
import { isErrorReport } from "../libs/flow";
import { dbFindOne } from "../libs/flow/mongodb";
import {
  Creator,
  CreatorInWonderCard,
  CreatorInWonderDetail,
} from "../types/creator";
import { DB, Schema } from "../types/db";
import { Wonder, WonderCard, WonderDetail } from "../types/wonder";

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
  liked: false,
  reserved: false,
});
