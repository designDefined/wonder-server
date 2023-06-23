import { DateInformation, StoredImage } from "./utility";
import { WonderDB } from "./wonder";
import { WithId } from "mongodb";

export type Creator = {
  id: number;
  owner: string;
  name: string;
  summary: string;
  profileImage: StoredImage;
  dateInformation: DateInformation;
  createdWonder: WonderDB["id"][];
  instagram?: string;
};

export type CreatorDB = WithId<Required<Creator>>;

export type CreatorDisplay = Pick<Creator, "id" | "name" | "profileImage">;
