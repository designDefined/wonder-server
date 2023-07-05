import defineScenario, { setContext } from ".";

const testFlow = {
  req: {
    body: null,
    headers: { authorization: "123" },
    params: { id: "targetId" },
    query: {},
  },
  res: () => null,
  context: {
    someContext: "exist!",
  },
  data: null,
  status: "success",
} as const;

const setted = setContext<string, { someContext: string }>((f) => {
  return Promise.resolve(f.context.someContext);
})("newContext");

/* 

const simple = pipe(
  setted,
  setContext<boolean, { newContext: string }>((f) =>
    Promise.resolve(f.context.newContext === "hey!"),
  )("boolContext"),
  setContext<string, { someContext: string; newContext: string }>(async (f) =>
    Promise.resolve(f.context.someContext + f.context.newContext),
  )("dataContext"),
  setData<string, { dataContext: string }>((f) => f.context.dataContext),
)(Promise.resolve(testFlow));

const complicated = pipe(
  parsePlot(setted),
  parsePlot(
    setContext<boolean, { newContext: string }>((f) =>
      Promise.resolve(f.context.newContext === "hey!"),
    )("boolContext"),
  ),
)(Promise.resolve(testFlow));


*/

export const finalTest = () =>
  defineScenario(
    setted,
    setContext<boolean, { newContext: string }>((f) =>
      Promise.resolve(f.context.newContext === "hey!"),
    )("boolContext"),
    setContext<
      string,
      { someContext: string; newContext: string; boolContext: boolean }
    >(async (f) =>
      Promise.resolve(f.context.someContext + " and " + f.context.newContext),
    )("dataContext"),
  )(Promise.resolve(testFlow));
