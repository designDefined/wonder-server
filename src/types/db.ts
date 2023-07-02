import { WithId } from "mongodb";
import { User } from "./user";
import { Wonder } from "./wonder";
import { Creator } from "./creator";

type UserSchema = Omit<
  User,
  "reservedWonders" | "likedWonders" | "ticketBook" | "ownedCreators"
> & {
  reservedWonders: User["reservedWonders"][number]["id"][];
  likedWonders: User["likedWonders"][number]["id"][];
  ticketBook: User["ticketBook"][number]["id"][];
  ownedCreators: User["ownedCreators"][number]["id"][];
};

type CreatorSchema = Omit<Creator, "createdWonder" | "owner"> & {
  createdWonder: Creator["createdWonder"][number]["id"][];
  owner: WithId<Creator["owner"]>["_id"];
};

type WonderSchema = Omit<Wonder, "creator" | "likedUsers" | "reservations"> & {
  creator: WithId<Wonder["creator"]>["_id"];
  likedUsers: Wonder["likedUsers"][number]["id"][];
  reservations: Wonder["reservations"];
};

export type Schema = {
  user: UserSchema;
  wonder: WonderSchema;
  creator: CreatorSchema;
};

export type DB = {
  user: WithId<UserSchema>;
  wonder: WithId<WonderSchema>;
  creator: WithId<CreatorSchema>;
};
