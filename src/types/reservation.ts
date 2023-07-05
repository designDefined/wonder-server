import { User } from "./user";
import { DateInformation } from "./utility";
import { Wonder, WonderSchedule } from "./wonder";

export type ReservationData = {
  wonder: Wonder["id"];
  userId: User["id"];
  name?: User["name"];
  phoneNumber?: User["phoneNumber"];
  email?: User["email"];
};
export type ReservationTime = WonderSchedule;

// {
//   day: [number, number, number];
//   time: [number, number][];
// };

export type Reservation = {
  id: number;
  wonder: Wonder;
  user: User;
  time: ReservationTime;
  data: ReservationData;
  dateInformation: DateInformation;
};
