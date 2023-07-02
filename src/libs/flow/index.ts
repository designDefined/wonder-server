import { pipe } from "ramda";
import {
  ParsePlot,
  Finale,
  DefineScenario,
  ExtractRequest,
  SetContext,
  SetData,
  AppendData,
  BaseFlow,
  FlowError,
  FlowErrorReport,
  CutData,
  ParseContextToInt,
  MapData,
  ExtractBody,
} from "./types";

/**
 * Core Functions
 */
export const parsePlot: ParsePlot = (plot) => async (flow) => {
  const awaitedFlow = await flow;
  if (awaitedFlow.status === "error") return Promise.resolve(awaitedFlow);
  const result = await plot(awaitedFlow);
  return Promise.resolve(result);
};

export const sendResponse: Finale = async (f) => {
  const awaitedF = await f;
  if (awaitedF.status === "error") {
    const { res, error_code, error_message } = awaitedF;
    res(error_code, error_message);
  } else {
    const { res, data } = awaitedF;
    res(200, data);
  }
};

/**
 * Error
 */
export const raiseScenarioError =
  (error_code: number, error_message: string) =>
  <InputFlow extends BaseFlow>(flow: InputFlow): FlowError => {
    return { ...flow, status: "error", error_code, error_message };
  };
export const raiseScenarioErrorWithReport =
  ({ error_code, error_message }: FlowErrorReport) =>
  <InputFlow extends BaseFlow>(flow: InputFlow): FlowError =>
    raiseScenarioError(error_code, error_message)(flow);

export const raiseSimpleError = (
  error_code: number,
  error_message: string,
): FlowErrorReport => ({ error_code, error_message });

export const isErrorReport = <T>(
  value: T | FlowErrorReport,
): value is FlowErrorReport =>
  typeof value === "object"
    ? (value as FlowErrorReport).error_code !== undefined
    : false;

/**
 * Debug
 */
export const prompt = <InputFlow extends BaseFlow>(f: InputFlow): InputFlow => {
  console.log(f);
  return f;
};
export const promptWithFlag =
  (flag: string) =>
  <InputFlow extends BaseFlow>(f: InputFlow): InputFlow => {
    console.log(`prompt start: ${flag}`);
    console.log(f);
    console.log(`prompt end: ${flag}`);
    return f;
  };

/**
 * Request
 */
export const extractRequest: ExtractRequest = (filter) => (inputFlow) => {
  const { req } = inputFlow;
  const { headers, params, query } = req;
  const errors: string[] = [];

  const extractedHeaders = filter.headers.reduce((acc, propName) => {
    if (headers[propName]) {
      const value = headers[propName] as string;
      return { ...acc, [propName]: value };
    } else {
      errors.push(`요청 헤더에서 ${propName}을 찾을 수 없습니다`);
      return acc;
    }
  }, {});
  const extractedParams = filter.params.reduce((acc, propName) => {
    if (params[propName]) {
      const value = params[propName];
      return { ...acc, [propName]: value };
    } else {
      errors.push(`패러미터에서 ${propName}을 찾을 수 없습니다`);
      return acc;
    }
  }, {});
  const extractedQuery = filter.query.reduce((acc, propName) => {
    if (params[propName]) {
      const value = params[propName];
      return { ...acc, [propName]: value };
    } else {
      errors.push(`쿼리에서 ${propName}을 찾을 수 없습니다`);
      return acc;
    }
  }, {});
  const newFlow = {
    ...inputFlow,
    context: {
      ...inputFlow.context,
      ...extractedHeaders,
      ...extractedParams,
      ...extractedQuery,
    },
  };
  return errors.length > 0
    ? raiseScenarioError(402, errors.join("\n "))(inputFlow)
    : newFlow;
};
const typeEqual = (a: any, b: any): boolean => {
  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => typeEqual(a[key], b[key]));
  } else {
    return typeof a === typeof b;
  }
};

export const extractBody: ExtractBody = (toCompare) => (inputFlow) => {
  const { req } = inputFlow;
  const { body } = req;

  if (typeEqual(body, toCompare)) {
    const validBody = body as typeof toCompare;
    return { ...inputFlow, context: { ...inputFlow.context, body: validBody } };
  }
  return raiseScenarioError(402, "body가 정확하지 않습니다")(inputFlow);
};

/**
 * Context
 */
export const setContext: SetContext =
  (selector) => (key) => async (inputFlow) => {
    const newContext = await selector(inputFlow);
    return isErrorReport(newContext)
      ? raiseScenarioErrorWithReport(newContext)(inputFlow)
      : {
          ...inputFlow,
          context: { ...inputFlow.context, [key]: newContext },
        };
  };

export const parseContextToInt: ParseContextToInt = (key) => (inputFlow) => {
  const intValue = parseInt(inputFlow["context"][key]);
  return isNaN(intValue)
    ? raiseScenarioError(402, `${key}가 숫자가 아닙니다`)(inputFlow)
    : { ...inputFlow, context: { ...inputFlow.context, [key]: intValue } };
};

/**
 * Data
 */
export const setData: SetData = (selector) => async (inputFlow) => {
  const newData = await selector(inputFlow);
  return isErrorReport(newData)
    ? raiseScenarioErrorWithReport(newData)(inputFlow)
    : {
        ...inputFlow,
        data: newData,
      };
};

export const appendData: AppendData =
  (selector) => (key) => async (inputFlow) => {
    const newDataValue = await selector(inputFlow);
    return isErrorReport(newDataValue)
      ? //? { ...inputFlow, status: "error", ...newDataValue }
        raiseScenarioErrorWithReport(newDataValue)(inputFlow)
      : {
          ...inputFlow,
          data: { ...inputFlow.data, [key]: newDataValue },
        };
  };

export const mapData: MapData = (mapper) => async (inputFlow) => {
  const mappedData = await Promise.all(
    inputFlow.data.map(
      async (data, i) => await mapper(data, inputFlow.context, i),
    ),
  );
  return { ...inputFlow, data: mappedData };
};
export const cutData: CutData = (key) => (inputFlow) => {
  const { data } = inputFlow;
  const { [key]: omit, ...newData } = data;
  return { ...inputFlow, data: newData };
};

/**
 * Core
 */
const defineScenario: DefineScenario = (...plots) =>
  pipe(...plots.map(parsePlot), sendResponse);

export default defineScenario;
