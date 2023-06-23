let creatorId = 3;
let wonderId = 0;
let userId = 0;

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
