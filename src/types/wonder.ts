import { DateInformation, StoredImage } from "./utility";
import { CreatorDisplay } from "./creator";
import { WithId } from "mongodb";

export type Wonder = {
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
