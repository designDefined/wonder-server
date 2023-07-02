import {
  Creator,
  CreatorInWonderCard,
  CreatorInWonderDetail,
} from "../types/creator";
import { Schema } from "../types/db";

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
