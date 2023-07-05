import {
  Db,
  Filter,
  ObjectId,
  OptionalUnlessRequiredId,
  UpdateFilter,
  WithId,
} from "mongodb";
import { raiseSimpleError } from "..";
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

export const dbFindLastAsManyAs =
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
      .sort({ id: -1 })
      .limit(amount)
      .toArray();

    if (!data || data.length < 1)
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

export const dbFindLastOne =
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
      .find(filter, config)
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    if (!data || data.length < 1)
      return raiseSimpleError(
        500,
        `데이터 ${collectionName}를(을) 찾을 수 없습니다`,
      );

    return Promise.resolve(data[0]);
  };

export const dbUpdateOne =
  <CollectionType extends Record<string, any>>(collectionName: string) =>
  (filter: Filter<CollectionType>, data: UpdateFilter<CollectionType>) =>
  async (db: Db | null): Promise<boolean | FlowErrorReport> => {
    if (!db) return raiseSimpleError(500, "DB와 연결할 수 없습니다");
    const updateResult = await db
      .collection<CollectionType>(collectionName)
      .updateOne(filter, data);
    if (!updateResult.acknowledged)
      return raiseSimpleError(500, "데이터를 수정할 수 없습니다");
    return updateResult.matchedCount > 0
      ? true
      : raiseSimpleError(500, "아무 데이터도 수정되지 않았습니다");
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
