import { DateInformation, StoredImage } from "./utility";
import { CreatorDisplay } from "./creator";

export type WonderDB = {
  id: number;
  title: string;
  tags: string[];
  creator: string;
  thumbnail: StoredImage;
  summary: string;
  content: string;
  schedule: { date: [number, number, number]; time: [number, number] }[];
  location: string;
  reservationProcess: null;
  dateInformation: DateInformation;
};

export type WonderView = Omit<WonderDB, "creator"> & {
  creator: CreatorDisplay;
};

export type WonderCardDisplay = Pick<
  WonderDB,
  "id" | "title" | "tags" | "thumbnail"
> & {
  creator: CreatorDisplay;
};
