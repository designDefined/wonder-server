import { pipe } from "ramda";
import { parsePlot, sendResponse } from "..";
import { DefineScenarioOf, InitialFlow } from "../types";
import { RequestHandler } from "express";

const parseExpressRequest = async (
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
): Promise<InitialFlow> => {
  const initialFlow: InitialFlow = {
    req: {
      body: req.body,
      headers: req.headers,
      params: req.params,
      query: req.query as Record<string, string>, // is it okay?
    },
    res: (status, data) => {
      typeof data === "object"
        ? res.status(status).json(data)
        : res.status(status).send(data);
    },
    context: {},
    data: null,
    status: "success",
  };
  return Promise.resolve(initialFlow);
};

const defineScenario: DefineScenarioOf<RequestHandler> =
  (...plots) =>
  (req, res) => {
    return pipe(
      //@ts-ignore
      ...plots.filter((a) => a !== undefined).map(parsePlot),
      sendResponse,
    )(parseExpressRequest(req, res));
  };

export default defineScenario;
