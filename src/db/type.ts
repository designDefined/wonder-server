import { User, UserDB } from "../types/user";
import { Creator, CreatorDB } from "../types/creator";
import { Wonder, WonderDB } from "../types/wonder";

export type DBSchema = Readonly<{
  user: User;
  creator: Creator;
  wonder: Wonder;
}>;

type A = keyof DBSchema;

export const translateCollection = (key: keyof DBSchema) => {
  switch (key) {
    case "user":
      return "유저";
    case "creator":
      return "크리에이터";
    case "wonder":
      return "원더";
  }
};
