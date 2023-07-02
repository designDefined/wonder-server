import {
  Db,
  Filter,
  ObjectId,
  OptionalUnlessRequiredId,
  WithId,
} from "mongodb";
import { raiseSimpleError } from "..";
import { DbFindOne } from "./types";
import { FlowErrorReport } from "../types";

export const dbFind =
  <CollectionType extends Record<string, any>>(collectionName: string) =>
  (
    filter: Filter<CollectionType> = {},
    projection?: Partial<Record<keyof WithId<CollectionType>, 0 | 1>>,
  ) =>
  async (
    db: Db | null,
  ): Promise<WithId<CollectionType>[] | FlowErrorReport> => {
    if (!db) return raiseSimpleError(500, "DB와 연결할 수 없습니다");

    const config = projection ? { projection } : {};
    const data = await db
      .collection<CollectionType>(collectionName)
      .find(filter, config)
      .toArray();

    if (!data)
      return raiseSimpleError(
        500,
        `데이터 ${collectionName}를(을) 찾을 수 없습니다`,
      );

    return Promise.resolve(data);
  };

export const dbFindAsManyAs =
  <CollectionType extends Record<string, any>>(collectionName: string) =>
  (amount: number) =>
  (
    filter: Filter<CollectionType> = {},
    projection?: Partial<Record<keyof WithId<CollectionType>, 0 | 1>>,
  ) =>
  async (
    db: Db | null,
  ): Promise<WithId<CollectionType>[] | FlowErrorReport> => {
    if (!db) return raiseSimpleError(500, "DB와 연결할 수 없습니다");

    const config = projection ? { projection } : {};
    const data = await db
      .collection<CollectionType>(collectionName)
      .find(filter, config)
      .limit(amount)
      .toArray();

    if (!data)
      return raiseSimpleError(
        500,
        `데이터 ${collectionName}를(을) 찾을 수 없습니다`,
      );

    return Promise.resolve(data);
  };

export const dbFindOne =
  <CollectionType extends Record<string, any>>(collectionName: string) =>
  (
    filter: Filter<CollectionType> = {},
    projection?: Partial<Record<keyof WithId<CollectionType>, 0 | 1>>,
  ) =>
  async (db: Db | null): Promise<WithId<CollectionType> | FlowErrorReport> => {
    if (!db) return raiseSimpleError(500, "DB와 연결할 수 없습니다");

    const config = projection ? { projection } : {};
    const data = await db
      .collection<CollectionType>(collectionName)
      .findOne(filter, config);

    if (!data)
      return raiseSimpleError(
        500,
        `데이터 ${collectionName}를(을) 찾을 수 없습니다`,
      );

    return Promise.resolve(data);
  };

export const dbInsertOne =
  <CollectionType extends Record<string, any>>(collectionName: string) =>
  (data: OptionalUnlessRequiredId<CollectionType>) =>
  async (db: Db | null): Promise<ObjectId | FlowErrorReport> => {
    if (!db) return raiseSimpleError(500, "DB와 연결할 수 없습니다");
    const insertResult = await db
      .collection<CollectionType>(collectionName)
      .insertOne(data);
    return insertResult.acknowledged
      ? insertResult.insertedId
      : raiseSimpleError(500, "데이터를 삽입할 수 없습니다");
  };
