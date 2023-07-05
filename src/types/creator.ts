import { User } from "./user";
import { DateInformation, StoredImage } from "./utility";
import { Wonder } from "./wonder";

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

/**
 * Types For Situations
 */

export type CreatorInWonderCard = Pick<Creator, "id" | "name" | "profileImage">;
export type CreatorInWonderDetail = Pick<
  Creator,
  "id" | "name" | "profileImage"
> & { subscribed: boolean };
export type OwnedCreator = Pick<Creator, "id" | "profileImage" | "name">;

export type CreatorDetail = Pick<
  Creator,
  "id" | "name" | "profileImage" | "summary" | "instagram"
> & {
  isMine: boolean;
};

export type NewCreator = Pick<Creator, "name" | "summary" | "instagram">;
