import { StoredImage } from "../types/utility";
const baseS3URL = "https://wonder-image-test.s3.ap-northeast-2.amazonaws.com/";
export const sampleImageURL: {
  user: () => StoredImage;
  creator: () => StoredImage;
} = {
  user: () => ({
    src: `${baseS3URL}sample/thumbnail_sample_1.png`,
    altText: "sample user thumbnail",
  }),
  creator: () => ({
    src: `${baseS3URL}sample/thumbnail_sample_2.png`,
    altText: "sample creator thumbnail",
  }),
};
