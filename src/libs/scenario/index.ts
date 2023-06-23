import { RequestHandler } from "express";
import { andThen, pipe } from "ramda";
import db from "../../db/connect";
import { User, UserDB } from "../../types/user";
import { DBSchema, translateCollection } from "../../db/type";

/**
 * BASIC TYPES
 */
type InitialFlow = {
  req: Parameters<RequestHandler>[0];
  res: Parameters<RequestHandler>[1];
  status: "processing" | "success" | "error";
};
type ExtendedFlow = Data & ErrorData & MongoDB;
type RichFlow = InitialFlow & ExtendedFlow;
type Flow = InitialFlow & Partial<ExtendedFlow>;

type Plot = (f: Flow) => Promise<Flow>;
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
type MongoDB = { db: any };
type AddToFlow<CurrentFlow extends Flow, FlowToAdd extends Flow> = CurrentFlow &
  FlowToAdd;

/**
 * CORE FUNCTION
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
    res.status(error_code).json({ isSuccess: false, error_message });
  } else {
    res.status(200).json({ isSuccess: true, data: data });
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
 * Functions
 */
export const error: (message?: string, code?: number) => Plot =
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

export const hijack: Plot = (flow) =>
  Promise.resolve({
    ...flow,
    data: "hijacked!",
  });

export const findOne =
  <CollectionName extends keyof DBSchema>(
    collection: CollectionName,
    filter: Partial<DBSchema[CollectionName]> | Record<string, never> = {},
    projection: Partial<DBSchema[CollectionName]> | Record<string, never> = {},
  ): Plot =>
  async (flow) => {
    if (!db()) return error("DB와 연결할 수 없습니다")(flow);

    const data = await db()
      ?.collection<DBSchema[CollectionName]>(collection)
      .findOne(filter, {
        projection: projection,
      });

    if (!data)
      return error(`${translateCollection(collection)}를(을) 찾을 수 없습니다`)(
        flow,
      );

    return appendData({ [collection]: data })(flow);
  };

export default defineScenario;
