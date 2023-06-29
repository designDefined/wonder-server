let creatorId = 0;
let wonderId = 0;
let userId = 3;

export const unique = {
  creatorId: () => {
    creatorId++;
    return creatorId;
  },
  wonderId: () => {
    wonderId++;
    return wonderId;
  },
  userId: () => {
    userId++;
    return userId;
  },
};
