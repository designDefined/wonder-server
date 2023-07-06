import { DateInformation, StoredImage } from "./utility";
import { Creator, CreatorInWonderCard, CreatorInWonderDetail } from "./creator";
import { User } from "./user";
import { Reservation } from "./reservation";

export type WonderTag = { isPrimary: boolean; value: string };
export type WonderContent = string;
export type WonderSchedule = {
  date: [number, number, number];
  time: [number, number][];
};
export type WonderLocation = { x: number; y: number; name: string };
export type WonderReservationProcess =
  | false
  | {
      requireName: boolean;
      requirePhoneNumber: boolean;
      requireEmail: boolean;
    };

export type Wonder = {
  id: number;
  title: string;
  tags: WonderTag[];
  creator: Creator;
  thumbnail: StoredImage;
  summary: string;
  content: string;
  schedule: WonderSchedule[];
  location: WonderLocation;
  reservationProcess: WonderReservationProcess;
  dateInformation: DateInformation;
  /** for owners */
  likedUsers: User[];
  reservations: Reservation[];
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

export type MyWonderSummary = {
  liked: WonderSummaryTitleOnly | null;
  reserved: WonderSummaryReservation | null;
  ticketBook: WonderSummaryReservation | null;
};
export type WonderSummaryTitleOnly = Pick<Wonder, "id" | "title" | "thumbnail">;

export type WonderSummaryReservation = Pick<
  Wonder,
  "id" | "title" | "thumbnail" | "location"
> & {
  reservedTime: Wonder["schedule"][number];
};

export type NewWonderImage = { file: File; url: string; fileName: string };

export type NewWonderWithRawImage = Pick<
  Wonder,
  | "title"
  | "summary"
  | "content"
  | "schedule"
  | "location"
  | "reservationProcess"
> & {
  tags: string[];
  thumbnail: NewWonderImage;
};

export type NewWonder = Pick<
  Wonder,
  | "title"
  | "summary"
  | "content"
  | "schedule"
  | "location"
  | "reservationProcess"
> & {
  tags: string[];
  thumbnail: Wonder["thumbnail"];
};
