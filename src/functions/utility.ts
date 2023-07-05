export const deleteNull = <T>(arr: (T | null)[]): T[] => {
  const nonNull: T[] = [];
  arr.forEach((item) => {
    if (item !== null) {
      nonNull.push(item);
    }
  });
  return nonNull;
};
