import { DateInformation, StoredImage } from "./utility";
import { Wonder } from "./wonder";
import { Creator } from "./creator";
import { WithId } from "mongodb";

export type User = {
  id: number;
  platformType: "NAVER" | "ADMIN";
  name: string;
  nickname: string;
  phoneNumber: string;
  email: string;
  profileImage: StoredImage;
  dateInformation: DateInformation;
  reservedWonders: Wonder["id"][];
  likedWonders: Wonder["id"][];
  ticketBook: Wonder["id"][];
  ownedCreators: Creator["id"][];
};

export type UserDB = WithId<User>;

export type UserDisplaySimple = Pick<
  User,
  "id" | "name" | "nickname" | "profileImage"
>;
