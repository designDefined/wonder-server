import { Document, model, Schema } from "mongoose";

export type KittenDocument = Document & {
  name: string;
};
const kittenSchema = new Schema<KittenDocument>({
  name: { type: String, required: true },
});

kittenSchema.statics.findByName = function (name: string) {
  return this.find({ name: new RegExp(name, "i") });
};

export const Kitten = model<KittenDocument>("Kitten", kittenSchema);
