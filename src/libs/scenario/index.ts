import { Request, RequestHandler } from "express";
import { andThen, pipe } from "ramda";
import db from "../../db/connect";
import { DBSchema, translateCollection } from "../../db/type";
import { WithId } from "mongodb";

/**
 * BASIC TYPES
 */
type InitialFlow = {
  req: Parameters<RequestHandler>[0];
  res: Parameters<RequestHandler>[1];
  status: "processing" | "success" | "error";
};
type ExtendedFlow = Data & ErrorData & Cache & MongoDB;
type RichFlow = InitialFlow & ExtendedFlow;
type Flow = InitialFlow & Partial<ExtendedFlow>;

export type Plot = (f: Flow) => Promise<Flow>;
type PlotEnd = (f: Flow) => void;
type PlotAsync = (f: Flow) => Promise<Flow>;

/**
 * EXTENDED TYPES
 */
type Data = { data: any };
type ErrorData = {
  error_code: number;
  error_message: string;
};
type Cache = {
  cache: Record<string, any>;
};
type MongoDB = { db: any };
type AddToFlow<CurrentFlow extends Flow, FlowToAdd extends Flow> = CurrentFlow &
  FlowToAdd;

/**
 * CORE
 */
const wait: (
  plot: Plot | PlotEnd,
) => (flow: Promise<Flow>) => Promise<void | Flow> = (plot) => async (flow) => {
  const resolvedFlow = await flow;
  return plot(resolvedFlow);
};

const check =
  (plot: Plot): Plot =>
  (flow) =>
    flow.status === "error" ? Promise.resolve(flow) : plot(flow);

const send: PlotEnd = (flow) => {
  const { status, res, data } = flow;
  if (status === "error") {
    const { error_code, error_message } = flow as {
      error_code: number;
      error_message: string;
    };
    res.status(error_code).json({ error_code, error_message });
  } else {
    typeof data === "object"
      ? res.status(200).json(data)
      : res.status(200).send(data);
  }
};

const defineScenario =
  (...plots: PlotAsync[]): RequestHandler =>
  (req, res) =>
    pipe(
      ...plots.map(check).map(wait),
      wait(send),
    )(Promise.resolve({ status: "processing", req, res }));

/**
 * Basic Functions
 */
export const raiseError: (message?: string, code?: number) => Plot =
  (message = "알 수 없는 에러", code = 500) =>
  (flow: Flow) =>
    Promise.resolve({
      ...flow,
      status: "error",
      error_code: code,
      error_message: message,
    });
export const appendData: (data: Record<string, any>) => Plot =
  (data) => (flow: Flow) =>
    Promise.resolve({
      ...flow,
      data: { ...flow.data, ...data },
    });
export const setData: (data: any) => Plot = (data) => (flow: Flow) =>
  Promise.resolve({ ...flow, data });
export const selectData =
  (propName: string): Plot =>
  (flow) =>
    flow.data[propName]
      ? Promise.resolve({ ...flow, data: flow.data[propName] })
      : Promise.resolve(flow);

/**
 * Debug Functions
 */
export const hijack: Plot = (flow) =>
  Promise.resolve({
    ...flow,
    data: "hijacked!",
  });
export const echo: Plot = (flow) =>
  Promise.resolve({
    ...flow,
    data: flow.req.body,
  });
export const promptCache: Plot = (flow) => {
  console.log(flow.cache);
  return Promise.resolve(flow);
};
export const promptData: Plot = (flow) => {
  console.log(flow.data);
  return Promise.resolve(flow);
};
export const promptRequest: Plot = (flow) => {
  console.log("body");
  console.log(flow.req.body);
  console.log("params");
  console.log(flow.req.params);
  console.log("query");
  console.log(flow.req.query);
  return Promise.resolve(flow);
};

/**
 * Cache Functions
 */
export const setCache: (cache: Record<string, any>) => Plot =
  (cache) => (flow: Flow) =>
    Promise.resolve({ ...flow, cache });

export const mapCache: (
  mapper: (cache: Record<string, any>) => Record<string, any>,
) => Plot = (mapper) => (flow: Flow) =>
  Promise.resolve({ ...flow, cache: mapper(flow.cache) });

export const appendCache: (cache: Record<string, any>) => Plot =
  (cache) => (flow: Flow) =>
    Promise.resolve({ ...flow, cache: { ...flow.cache, ...cache } });

export const parseCacheToNumber: (key: string) => Plot = (key) => (flow) => {
  const cacheToParse = flow.cache[key];
  if (!cacheToParse)
    return raiseError(
      `${key}는 존재하지 않는 캐시 키이므로 숫자로 변환할 수 없습니다.`,
      500,
    )(flow);
  const parsed = Number(cacheToParse);
  if (isNaN(parsed))
    return raiseError(`${key}는 숫자로 전달되어야 합니다`, 400)(flow);
  return Promise.resolve({ ...flow, cache: { ...flow.cache, [key]: parsed } });
};
/**
 * Request Functions
 */
export const extractRequest =
  (extractor: Partial<Record<keyof Flow["req"], string[]>>): Plot =>
  (flow) => {
    const errors: string[] = [];
    const extracted = {};

    Object.entries(extractor).forEach(([field, propNames]) => {
      const extractedValues = propNames.reduce((acc, propName: string) => {
        if (flow.req[field][propName]) {
          return { ...acc, [propName]: flow.req[field][propName] };
        } else {
          errors.push(`${field}에서 ${propName}을 찾을 수 없습니다`);
          return acc;
        }
      }, {});
      extracted[field] = extractedValues;
    });
    if (errors.length > 0) {
      return raiseError(errors.join("\n"), 400)(flow);
    } else {
      return appendCache({
        ...(extracted.body ?? {}),
        ...(extracted.query ?? {}),
        ...(extracted.params ?? {}),
      })(flow);
    }
  };

/**
 * DB Functions
 */
export const withCache =
  (find: typeof findOne | typeof findAll | typeof findAsManyAs) =>
  <CollectionName extends keyof DBSchema>(
    collection: CollectionName,
    projection: Partial<DBSchema[CollectionName]> | Record<string, never> = {},
  ): Plot =>
  (flow) =>
    flow.cache
      ? find(collection, flow.cache, projection)(flow)
      : raiseError("캐시가 없습니다", 500)(flow);

export const findOneSimply = async <CollectionName extends keyof DBSchema>(
  collection: CollectionName,
  filter: Partial<DBSchema[CollectionName]> | Record<string, never> = {},
  projection:
    | Record<keyof Partial<DBSchema[CollectionName]>, 0 | 1>
    | Record<string, never> = {},
): Promise<DBSchema[CollectionName] | null | undefined> => {
  if (!db()) return Promise.resolve(null);

  const data = await db()
    ?.collection<DBSchema[CollectionName]>(collection)
    .findOne(filter, {
      projection: projection,
    });

  if (!data) return Promise.resolve(null);

  return data;
};

export const findOne =
  <CollectionName extends keyof DBSchema>(
    collection: CollectionName,
    filter: Partial<DBSchema[CollectionName]> | Record<string, never> = {},
    projection:
      | Record<keyof Partial<DBSchema[CollectionName]>, 0 | 1>
      | Record<string, never> = {},
  ): Plot =>
  async (flow) => {
    if (!db()) return raiseError("DB와 연결할 수 없습니다")(flow);

    const data = await db()
      ?.collection<DBSchema[CollectionName]>(collection)
      .findOne(filter, {
        projection: projection,
      });

    if (!data)
      return raiseError(
        `${translateCollection(collection)}를(을) 찾을 수 없습니다`,
      )(flow);

    return appendData({ [collection]: data })(flow);
  };

export const findAll =
  <CollectionName extends keyof DBSchema>(
    collection: CollectionName,
    filter: Partial<DBSchema[CollectionName]> | Record<string, never> = {},
    projection:
      | Record<keyof Partial<DBSchema[CollectionName]>, 0 | 1>
      | Record<string, never> = {},
  ): Plot =>
  async (flow) => {
    if (!db()) return raiseError("DB와 연결할 수 없습니다")(flow);

    const data = await db()
      ?.collection<DBSchema[CollectionName]>(collection)
      .find(filter, {
        projection: projection,
      })
      .toArray();

    if (!data)
      return raiseError(
        `${translateCollection(collection)}를(을) 찾을 수 없습니다`,
      )(flow);

    return appendData({ [`${collection}s`]: data })(flow);
  };

export const findAsManyAs =
  (amount: number) =>
  <CollectionName extends keyof DBSchema>(
    collection: CollectionName,
    filter: Partial<DBSchema[CollectionName]> | Record<string, never> = {},
    projection:
      | Record<keyof Partial<DBSchema[CollectionName]>, 0 | 1>
      | Record<string, never> = {},
  ): Plot =>
  async (flow) => {
    if (!db()) return raiseError("DB와 연결할 수 없습니다")(flow);

    const data = await db()
      ?.collection<DBSchema[CollectionName]>(collection)
      .find(filter, {
        projection: projection,
      })
      .limit(amount)
      .toArray();

    if (!data)
      return raiseError(
        `${translateCollection(collection)}를(을) 찾을 수 없습니다`,
      )(flow);

    return appendData({ [`${collection}s`]: data })(flow);
  };

export default defineScenario;
