/* eslint-disable @typescript-eslint/no-unsafe-call */
//@ts-nocheck

import dotenv from "dotenv";
import aws from "aws-sdk";
import { raiseSimpleError } from "../libs/flow";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

dotenv.config();

export const uploadThumbnail = async (file: File, fileName: string) => {
  const accessKey = process.env.AWS_ACCESS_KEY ?? "";
  const secretKey = process.env.AWS_SECRET_KEY ?? "";
  const bucketName = process.env.AWS_BUCKET_NAME ?? "";

  const client = new S3Client({
    region: "ap-northeast-2",
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  const s3 = new aws.S3();
  const presigned = await createPresignedPost(client, {
    Bucket: bucketName,
    Key: fileName,
    Fields: { key: fileName },
    Expires: 60, // seconds
    Conditions: [
      { bucket: bucketName },
      ["content-length-range", 0, 1048576], //파일용량 1MB 까지 제한
    ],
  });

  const formData = new FormData();
  Object.entries({ ...presigned.fields, file }).forEach(([key, value]) => {
    formData.append(key, value);
  });
  const result = await fetch(presigned.url, {
    method: "POST",
    body: formData,
  });

  if (result.ok) {
    return result.url + "/" + fileName;
  } else {
    return raiseSimpleError(500, "이미지 업로드 실패");
  }
};
