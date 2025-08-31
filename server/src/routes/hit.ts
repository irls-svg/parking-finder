import { Request, Response, Router } from "express";
import {
  S3Client,
  CreateBucketCommand,
  GetObjectCommand,
  PutObjectCommand,
  BucketLocationConstraint,
} from "@aws-sdk/client-s3";
import { wrapper } from "../middleware/middleware";

const BUCKET = "cab432-n11252146-page-count";
const REGION = BucketLocationConstraint.ap_southeast_2;
const KEY = "page-count";

const client: S3Client = new S3Client({ region: REGION });

export const handleHits = wrapper(async (req: Request, res: Response) => {
  const hitCount = await getHitCount();
  res.status(200).send({ hits: hitCount });
});

export async function createBucketIfNotExists() {
  try {
    const { Location } = await client.send(
      new CreateBucketCommand({
        Bucket: BUCKET,
        CreateBucketConfiguration: { LocationConstraint: REGION },
      })
    );
    console.log("[S3] Created new bucket: ", Location);
  } catch (error: any) {
    if (error.name === "BucketAlreadyOwnedByYou") {
      console.log("[CreateBucket] S3 Error: Bucket already exists");
    } else {
      console.log("[CreateBucket] S3: ", error);
    }
  }
}

export async function createPageCountIfNotExists(): Promise<void> {
  try {
    const data = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }));
    console.log("[S3] Hit count: ", await data.Body?.transformToString());
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      await client.send(new PutObjectCommand({ Bucket: BUCKET, Key: KEY, Body: "0" }));
    } else {
      console.log("[CreatePageCount] S3:", error);
    }
  }
}

async function getHitCount() {
  try {
    const data = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }));
    const body = await data.Body?.transformToString();
    if (!body) throw new Error("[GetPageCount] S3: No data body");
    const hits = Number(body) + 1;
    await client.send(new PutObjectCommand({ Bucket: BUCKET, Key: KEY, Body: hits.toString() }));
    return hits;
  } catch (error) {
    console.log("[GetPageCount] S3:", error);
    return 0;
  }
}
