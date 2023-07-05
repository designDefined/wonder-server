import { Db } from "mongodb";
import { FlowErrorReport } from "../types";

export type DbFindOne = <CollectionType>(
  collectionName: string,
) => <Filter extends Record<string, any>>(
  filter: Filter,
) => (db: Db | null) => Promise<CollectionType | FlowErrorReport>;
