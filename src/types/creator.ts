import { DateInformation, StoredImage } from "./utility";
import { WonderDB } from "./wonder";

export type CreatorDB = {
  id: number;
  owner: string;
  name: string;
  summary: string;
  profileImage: StoredImage;
  dateInformation: DateInformation;
  createdWonder: WonderDB["id"][];
  instagram?: string;
};

export type CreatorDisplay = Pick<CreatorDB, "id" | "name" | "profileImage">;
