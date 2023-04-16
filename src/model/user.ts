import { Document, Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface UserDocument extends Document {
  platformType: string;
  name: string;
  nickname?: string;
  phoneNumber?: string;
  email: string;
  created_at: string;
  last_modified_at: string;
}

// 2. Create a Schema corresponding to the document interface.
const UserSchema = new Schema<UserDocument>({
  name: { type: String, required: true },
  nickname: String,
  phoneNumber: String,
  email: { type: String, required: true },
  created_at: { type: String, required: true },
  last_modified_at: { type: String, required: true },
});

// 3. Create a Model.
export const UserModel = model<UserDocument>("User", UserSchema);
