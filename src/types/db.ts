import { WithId } from "mongodb";
import { User } from "./user";
import { Wonder } from "./wonder";
import { Creator } from "./creator";
import { Reservation } from "./reservation";

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
  reservations: Wonder["reservations"][number]["id"][];
};

type ReservationSchema = Omit<Reservation, "wonder" | "user"> & {
  wonder: WithId<Reservation["wonder"]>["_id"];
  user: WithId<Reservation["user"]>["_id"];
};

export type Schema = {
  user: UserSchema;
  wonder: WonderSchema;
  creator: CreatorSchema;
  reservation: ReservationSchema;
};

export type DB = {
  user: WithId<UserSchema>;
  wonder: WithId<WonderSchema>;
  creator: WithId<CreatorSchema>;
  reservation: WithId<ReservationSchema>;
};
