import { Schema, model, Model } from "mongoose";

type User = {
  platformType: string;
  name: string;
  nickname?: string;
  phoneNumber?: string;
  email: string;
  created_at: string;
  last_modified_at: string;
};

type UserMethods = {};

type UserModel = Model<User, {}, UserMethods>;

const UserSchema = new Schema<User, UserModel, UserMethods>({
  platformType: { type: String, required: true },
  name: { type: String, required: true },
  nickname: String,
  phoneNumber: String,
  email: { type: String, required: true },
  created_at: { type: Date, required: true },
  last_modified_at: { type: Date, required: true },
});

export const User = model<User, UserModel>("User", UserSchema);
