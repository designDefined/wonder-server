import { DB, Schema } from "../types/db";
import {
  NewUserParameter,
  User,
  UserLoggedIn,
  UserWithEmail,
} from "../types/user";
import { sampleImageURL } from "./samples";
import { unique } from "./uniqueId";

export const toUserLoggedIn = (
  user: Schema["user"],
  token: string,
): UserLoggedIn => ({
  id: user.id,
  name: user.name,
  nickname: user.nickname,
  profileImage: user.profileImage,
  howManyCreatorsOwned: user.ownedCreators.length,
  needRegister: false,
  token,
});

export const prepareNewUser = ({
  name,
  phoneNumber,
  email,
  socialId,
}: NewUserParameter): Schema["user"] => {
  return {
    id: unique.userId(),
    platformType: "TEST",
    socialId,
    name,
    nickname: "새 유저",
    phoneNumber,
    email,
    profileImage: sampleImageURL.user(),
    dateInformation: { createdAt: new Date(), lastModifiedAt: new Date() },
    reservedWonders: [],
    likedWonders: [],
    ticketBook: [],
    ownedCreators: [],
  };
};

export const toUserWithEmail = (user: DB["user"] | User): UserWithEmail => ({
  id: user.id,
  nickname: user.nickname,
  profileImage: user.profileImage,
  email: user.email,
});
