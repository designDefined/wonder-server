import { User } from "./user";
import { DateInformation, StoredImage } from "./utility";
import { Wonder, WonderDB } from "./wonder";
import { WithId } from "mongodb";

export type Creator = {
  id: number;
  owner: User;
  name: string;
  summary: string;
  profileImage: StoredImage;
  dateInformation: DateInformation;
  createdWonder: Wonder[];
  subscribedUsers: User[];
  instagram?: string;
};

export type CreatorDB = WithId<Required<Creator>>;

export type CreatorDisplay = Pick<Creator, "id" | "name" | "profileImage">;

/**
 * Types For Situations
 */

export type CreatorInWonderCard = Pick<Creator, "id" | "name" | "profileImage">;
export type CreatorInWonderDetail = Pick<
  Creator,
  "id" | "name" | "profileImage"
> & { subscribed: boolean };
