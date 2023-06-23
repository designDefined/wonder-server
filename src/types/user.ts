import { DateInformation, StoredImage } from "./utility";
import { WonderDB } from "./wonder";
import { CreatorDB } from "./creator";

export type UserDB = {
  id: string;
  platformType: "NAVER" | "ADMIN";
  name: string;
  nickname: string;
  phoneNumber: string;
  email: string;
  profileImage: StoredImage;
  dateInformation: DateInformation;
  reservedWonders: WonderDB["id"][];
  likedWonders: WonderDB["id"][];
  ticketBook: WonderDB["id"][];
  ownedCreators: CreatorDB["id"];
};

export type UserSummary = Pick<
  UserDB,
  "id" | "name" | "nickname" | "profileImage"
>;
