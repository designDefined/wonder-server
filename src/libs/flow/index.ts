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
  Flow,
  CutData,
} from "./types";

/**
 * Core Fiucntions
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
  const body = req.body as (typeof inputFlow)["req"]["body"];
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
      body,
    },
  };
  return errors.length > 0
    ? raiseScenarioError(402, errors.join("\n "))(inputFlow)
    : newFlow;
};

/**
 * Context
 */
export const setContext: SetContext =
  (selector) => (key) => async (inputFlow) => {
    const newContext = await selector(inputFlow);
    return {
      ...inputFlow,
      context: { ...inputFlow.context, [key]: newContext },
    };
  };

/**
 * Data
 */
export const setData: SetData = (selector) => async (inputFlow) => {
  const newData = await selector(inputFlow);
  return isErrorReport(newData)
    ? { ...inputFlow, status: "error", ...newData }
    : {
        ...inputFlow,
        data: newData,
      };
};

export const appendData: AppendData =
  (selector) => (key) => async (inputFlow) => {
    const newDataValue = await selector(inputFlow);
    return isErrorReport(newDataValue)
      ? { ...inputFlow, status: "error", ...newDataValue }
      : {
          ...inputFlow,
          data: { ...inputFlow.data, [key]: newDataValue },
        };
  };

export const cutData: CutData = (key) => (inputFlow) => {
  const { data } = inputFlow;
  const { [key]: _, ...newData } = data;
  return { ...inputFlow, data: newData };
};

const defineScenario: DefineScenario = (...plots) =>
  pipe(...plots.map(parsePlot), sendResponse);

export default defineScenario;
