import {
  Creator,
  CreatorInWonderCard,
  CreatorInWonderDetail,
  NewCreator,
} from "../types/creator";
import { DB, Schema } from "../types/db";
import { sampleImageURL } from "./samples";
import { unique } from "./uniqueId";

export const toCreatorInWonderCard = (
  creator: Creator | Schema["creator"],
): CreatorInWonderCard => ({
  id: creator.id,
  name: creator.name,
  profileImage: creator.profileImage,
});

export const toCreatorInWonderDetail = (
  creator: Creator | Schema["creator"],
): CreatorInWonderDetail => ({
  id: creator.id,
  name: creator.name,
  profileImage: creator.profileImage,
  subscribed: false,
});

export const toOwnedCreator = (creator: Creator | Schema["creator"]) => ({
  id: creator.id,
  name: creator.name,
  profileImage: creator.profileImage,
});

export const prepareNewCreator = (
  { name, summary, instagram }: NewCreator,
  userId: DB["user"]["_id"],
): Schema["creator"] => ({
  id: unique.creatorId(),
  name,
  summary,
  owner: userId,
  profileImage: sampleImageURL.creator(),
  dateInformation: { createdAt: new Date(), lastModifiedAt: new Date() },
  createdWonder: [],
  subscribedUsers: [],
  instagram,
});
