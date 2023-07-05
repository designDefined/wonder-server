import { DateInformation, StoredImage } from "./utility";
import { Wonder } from "./wonder";
import { Creator } from "./creator";
import { Reservation } from "./reservation";

export type User = {
  id: number;
  platformType: "NAVER" | "KAKAO" | "GOOGLE" | "TEST" | "ADMIN";
  socialId: string;
  name: string;
  nickname: string;
  phoneNumber: string;
  email: string;
  profileImage: StoredImage;
  dateInformation: DateInformation;
  likedWonders: Wonder[];
  reservedWonders: Reservation[];
  ticketBook: Reservation[];
  ownedCreators: Creator[];
};

/**
 * Types For Situations
 */
export type UserLoggedIn = Pick<
  User,
  "id" | "name" | "nickname" | "profileImage"
> & {
  token: string;
  howManyCreatorsOwned: number;
  needRegister: false;
};

export type UserNeedRegister = Pick<User, "email"> & { needRegister: true };

export type UserRegisterForm = Pick<User, "email" | "name" | "phoneNumber"> & {
  access_token: string;
};
export type NewUserParameter = Omit<UserRegisterForm, "access_token"> & {
  socialId: string;
};

export type UserWithEmail = Pick<
  User,
  "id" | "nickname" | "email" | "profileImage"
>;
