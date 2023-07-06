import { StoredImage } from "../types/utility";
const baseS3URL = "https://wonder-image-test.s3.ap-northeast-2.amazonaws.com/";
export const sampleImageURL: {
  user: () => StoredImage;
  creator: () => StoredImage;
} = {
  user: () => ({
    src: `${baseS3URL}sample/no_profile.png`,
    altText: "sample user thumbnail",
  }),
  creator: () => ({
    src: `${baseS3URL}sample/no_profile.png`,
    altText: "sample creator thumbnail",
  }),
};
