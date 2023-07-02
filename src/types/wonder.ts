import { DateInformation, StoredImage } from "./utility";
import {
  Creator,
  CreatorDisplay,
  CreatorInWonderCard,
  CreatorInWonderDetail,
} from "./creator";
import { WithId } from "mongodb";
import { User } from "./user";

export type Wonder = {
  id: number;
  title: string;
  tags: string[];
  creator: Creator;
  thumbnail: StoredImage;
  summary: string;
  content: string;
  schedule: { date: [number, number, number]; time: [number, number] }[];
  location: string;
  reservationProcess: null;
  dateInformation: DateInformation;
  /** for owners */
  likedUsers: User[];
  reservations: number[];
};

export type WonderDB = WithId<Wonder>;

export type WonderView = Omit<Wonder, "creator"> & {
  creator: CreatorDisplay;
};
export type WonderCardDisplay = Pick<
  Wonder,
  "id" | "title" | "tags" | "thumbnail"
> & {
  creator: CreatorDisplay;
};
/**
 * Types For Situations
 */

export type WonderCard = Pick<Wonder, "id" | "title" | "thumbnail"> & {
  creator: CreatorInWonderCard;
};

export type WonderDetail = Omit<
  Wonder,
  "creator" | "likedUsers" | "reservations"
> & {
  creator: CreatorInWonderDetail;
  liked: boolean;
  reserved: boolean;
};
