import { StoredImage } from "../types/utility";

export const sampleImageURL: { user: () => StoredImage } = {
  user: () => ({ src: "", altText: "sample user image 1" }),
};
