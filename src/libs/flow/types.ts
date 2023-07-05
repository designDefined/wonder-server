/**
 * Basic types to build initial flow
 */
type RequestHeaderObject = Readonly<{
  accept?: string | undefined;
  "accept-language"?: string | undefined;
  "accept-patch"?: string | undefined;
  "accept-ranges"?: string | undefined;
  "access-control-allow-credentials"?: string | undefined;
  "access-control-allow-headers"?: string | undefined;
  "access-control-allow-methods"?: string | undefined;
  "access-control-allow-origin"?: string | undefined;
  "access-control-expose-headers"?: string | undefined;
  "access-control-max-age"?: string | undefined;
  "access-control-request-headers"?: string | undefined;
  "access-control-request-method"?: string | undefined;
  age?: string | undefined;
  allow?: string | undefined;
  "alt-svc"?: string | undefined;
  authorization?: string | undefined;
  "cache-control"?: string | undefined;
  connection?: string | undefined;
  "content-disposition"?: string | undefined;
  "content-encoding"?: string | undefined;
  "content-language"?: string | undefined;
  "content-length"?: string | undefined;
  "content-location"?: string | undefined;
  "content-range"?: string | undefined;
  "content-type"?: string | undefined;
  cookie?: string | undefined;
  date?: string | undefined;
  etag?: string | undefined;
  expect?: string | undefined;
  expires?: string | undefined;
  forwarded?: string | undefined;
  from?: string | undefined;
  host?: string | undefined;
  "if-match"?: string | undefined;
  "if-modified-since"?: string | undefined;
  "if-none-match"?: string | undefined;
  "if-unmodified-since"?: string | undefined;
  "last-modified"?: string | undefined;
  location?: string | undefined;
  origin?: string | undefined;
  pragma?: string | undefined;
  "proxy-authenticate"?: string | undefined;
  "proxy-authorization"?: string | undefined;
  "public-key-pins"?: string | undefined;
  range?: string | undefined;
  referer?: string | undefined;
  "retry-after"?: string | undefined;
  "sec-websocket-accept"?: string | undefined;
  "sec-websocket-extensions"?: string | undefined;
  "sec-websocket-key"?: string | undefined;
  "sec-websocket-protocol"?: string | undefined;
  "sec-websocket-version"?: string | undefined;
  "set-cookie"?: string[] | undefined;
  "strict-transport-security"?: string | undefined;
  tk?: string | undefined;
  trailer?: string | undefined;
  "transfer-encoding"?: string | undefined;
  upgrade?: string | undefined;
  "user-agent"?: string | undefined;
  vary?: string | undefined;
  via?: string | undefined;
  warning?: string | undefined;
  "www-authenticate"?: string | undefined;
}>;

export type HeaderKeys = keyof RequestHeaderObject;

export type ParsedRequestHeader = {
  readonly headers: RequestHeaderObject;
  readonly params: Record<string, string>;
  readonly query: Record<string, string>;
};

export type ParsedRequest = ParsedRequestHeader & {
  readonly body: any;
};

type ParsedResponse = (statusCode: number, data: any) => void;

/**
 * Flow
 */
export type Flow<ContextType extends Record<string, any>, DataType> = {
  req: ParsedRequest;
  res: ParsedResponse;
  context: ContextType;
  data: DataType;
  status: "success";
};
export type InitialFlow = Flow<Record<string, never>, null>;
export type BaseFlow = Flow<Record<string, any>, any>;

/**
 * Errors
 */
export type FlowError = {
  req: ParsedRequest;
  res: ParsedResponse;
  status: "error";
  error_code: number;
  error_message: string;
};
export type FlowErrorReport = Pick<FlowError, "error_code" | "error_message">;

/**
 * Plots
 */
export type Plot = (
  f: BaseFlow,
) => BaseFlow | FlowError | Promise<BaseFlow | FlowError>;
export type Finale = <I extends BaseFlow>(
  f: Promise<I | FlowError>,
) => Promise<void>;

/***
 *
 *
 *
 * Functions
 *
 *
 *
 */

/**
 * Utilities
 */
type Selector<RequiredFlow extends BaseFlow, ExpectedValue> = (
  f: RequiredFlow,
) => AcceptedSimpleReturn<ExpectedValue>;

export type CheckFlow = <
  RequiredContext extends Record<string, any> = Record<string, any>,
  RequiredData = any,
>(
  checker: (
    flow: Flow<RequiredContext, RequiredData>,
  ) => AcceptedSimpleReturn<void>,
) => <InputFlow extends Flow<RequiredContext, RequiredData>>(
  inputFlow: InputFlow,
) => AcceptedReturn<InputFlow>;

/**
 * Request
 */

export type ExtractRequest = <
  Filter extends Readonly<
    Record<Exclude<keyof ParsedRequestHeader, "headers">, readonly string[]> & {
      headers: HeaderKeys[];
    }
  >,
>(
  filter: Filter,
) => <InputFlow extends BaseFlow>(
  inputFlow: InputFlow,
) =>
  | Flow<
      InputFlow["context"] &
        Record<Filter[keyof ParsedRequestHeader][number], string>,
      InputFlow["data"]
    >
  | FlowError;

export type ExtractBody = <ExpectedValue>(
  toCompare: ExpectedValue,
) => <InputFlow extends BaseFlow>(
  inputFlow: InputFlow,
) =>
  | Flow<InputFlow["context"] & { body: ExpectedValue }, InitialFlow["data"]>
  | FlowError;
export type ExtractBodyLenient<ExpectedValue> = <InputFlow extends BaseFlow>(
  inputFlow: InputFlow,
) =>
  | Flow<InputFlow["context"] & { body: ExpectedValue }, InitialFlow["data"]>
  | FlowError;

/**
 * Context
 */
export type SetContext = <
  ExpectedValue,
  RequiredContext extends Record<string, any> = Record<string, any>,
  RequiredData = any,
>(
  selector: Selector<Flow<RequiredContext, RequiredData>, ExpectedValue>,
) => <Key extends string>(
  key: Key,
) => <InputFlow extends Flow<RequiredContext, RequiredData>>(
  inputFlow: InputFlow,
) => Promise<
  | Flow<
      InputFlow["context"] & Record<typeof key, ExpectedValue>,
      InputFlow["data"]
    >
  | FlowError
>;

export type ParseContextToInt = <Key extends string>(
  key: Key,
) => <InputFlow extends Flow<Record<Key, string>, unknown>>(
  inputFlow: InputFlow,
) =>
  | Flow<InputFlow["context"] & Record<Key, number>, InputFlow["data"]>
  | FlowError;

/**
 * Data
 */
export type SetData = <
  ExpectedValue,
  RequiredContext extends Record<string, any> = Record<string, any>,
  RequiredData = any,
>(
  selector: Selector<Flow<RequiredContext, RequiredData>, ExpectedValue>,
) => <InputFlow extends Flow<RequiredContext, RequiredData>>(
  inputFlow: InputFlow,
) => Promise<Flow<InputFlow["context"], ExpectedValue> | FlowError>;

export type MapData = <
  ExpectedValue extends unknown[],
  RequiredContext extends Record<string, any> = Record<string, any>,
  RequiredData extends unknown[] = unknown[],
>(
  mapper: (
    item: RequiredData[number],
    context: RequiredContext,
    index: number,
  ) => AcceptedSimpleReturn<ExpectedValue[number]>,
) => <InputFlow extends Flow<RequiredContext, RequiredData>>(
  inputFlow: InputFlow,
) => Promise<Flow<InputFlow["context"], ExpectedValue[number][]> | FlowError>;

export type AppendData = <
  ExpectedValue,
  RequiredContext extends Record<string, any> = Record<string, any>,
  RequiredData extends Record<string, any> = Record<string, any>,
>(
  selector: Selector<Flow<RequiredContext, RequiredData>, ExpectedValue>,
) => <Key extends string>(
  key: Key,
) => <InputFlow extends Flow<RequiredContext, RequiredData>>(
  inputFlow: InputFlow,
) => Promise<
  | Flow<
      InputFlow["context"],
      InputFlow["data"] & Record<typeof key, ExpectedValue>
    >
  | FlowError
>;

export type CutData = <Key extends string>(
  key: Key,
) => <InputFlow extends Flow<Record<string, any>, Record<Key, any>>>(
  inputFlow: InputFlow,
) => Flow<InputFlow["context"], Omit<InputFlow["data"], Key>>;

/**
 * Core Functions
 */
export type ParsePlot = <I extends BaseFlow, O extends BaseFlow | FlowError>(
  plot: (flow: I) => O | Promise<O> | FlowError | Promise<FlowError>,
) => (flow: Promise<I | FlowError>) => Promise<O | FlowError>;
type AcceptedSimpleReturn<T> =
  | T
  | FlowErrorReport
  | Promise<T | FlowErrorReport>;
type AcceptedReturn<T> = T | FlowError | Promise<T | FlowError>;

export type DefineScenario = <
  Init,
  R1,
  R2,
  R3,
  R4,
  R5,
  R6,
  R7,
  R8,
  R9,
  R10,
  R11,
  R12,
  R13,
  R14,
  R15,
  R16,
  R17,
  R18,
  R19,
  R20,
>(
  f1: (a: Init) => AcceptedReturn<R1>,
  f2?: (a: R1) => AcceptedReturn<R2>,
  f3?: (a: R2) => AcceptedReturn<R3>,
  f4?: (a: R3) => AcceptedReturn<R4>,
  f5?: (a: R4) => AcceptedReturn<R5>,
  f6?: (a: R5) => AcceptedReturn<R6>,
  f7?: (a: R6) => AcceptedReturn<R7>,
  f8?: (a: R7) => AcceptedReturn<R8>,
  f9?: (a: R8) => AcceptedReturn<R9>,
  f11?: (a: R9) => AcceptedReturn<R10>,
  f12?: (a: R10) => AcceptedReturn<R11>,
  f13?: (a: R11) => AcceptedReturn<R12>,
  f14?: (a: R12) => AcceptedReturn<R13>,
  f15?: (a: R13) => AcceptedReturn<R14>,
  f16?: (a: R14) => AcceptedReturn<R15>,
  f17?: (a: R15) => AcceptedReturn<R16>,
  f18?: (a: R16) => AcceptedReturn<R17>,
  f19?: (a: R17) => AcceptedReturn<R18>,
  f20?: (a: R18) => AcceptedReturn<R19>,
  f21?: (a: R19) => AcceptedReturn<R20>,
) => (init: Promise<Init>) => Promise<void>;

export type DefineScenarioOf<Handler> = <
  R1,
  R2,
  R3,
  R4,
  R5,
  R6,
  R7,
  R8,
  R9,
  R10,
  R11,
  R12,
  R13,
  R14,
  R15,
  R16,
  R17,
  R18,
  R19,
  R20,
>(
  f1: (a: InitialFlow) => AcceptedReturn<R1>,
  f2?: (a: R1) => AcceptedReturn<R2>,
  f3?: (a: R2) => AcceptedReturn<R3>,
  f4?: (a: R3) => AcceptedReturn<R4>,
  f5?: (a: R4) => AcceptedReturn<R5>,
  f6?: (a: R5) => AcceptedReturn<R6>,
  f7?: (a: R6) => AcceptedReturn<R7>,
  f8?: (a: R7) => AcceptedReturn<R8>,
  f9?: (a: R8) => AcceptedReturn<R9>,
  f11?: (a: R9) => AcceptedReturn<R10>,
  f12?: (a: R10) => AcceptedReturn<R11>,
  f13?: (a: R11) => AcceptedReturn<R12>,
  f14?: (a: R12) => AcceptedReturn<R13>,
  f15?: (a: R13) => AcceptedReturn<R14>,
  f16?: (a: R14) => AcceptedReturn<R15>,
  f17?: (a: R15) => AcceptedReturn<R16>,
  f18?: (a: R16) => AcceptedReturn<R17>,
  f19?: (a: R17) => AcceptedReturn<R18>,
  f20?: (a: R18) => AcceptedReturn<R19>,
  f21?: (a: R19) => AcceptedReturn<R20>,
) => Handler;
