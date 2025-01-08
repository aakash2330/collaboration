import { z } from "zod";

const joinMesssageTypeZod = z.object({
  event: z.literal("join"),
  token: z.string().min(1, {
    message: "Session Token size should be > 1",
  }),
  roomId: z.string().min(1, {
    message: "Room Id size should be > 1",
  }),
});

export type TjoinMessageTypeZod = z.infer<typeof joinMesssageTypeZod>;

const joinMesssageFromRedisTypeZod = z.object({
  event: z.literal("join"),
  userId: z.string().min(1, {
    message: "User Id size should be > 1",
  }),
  roomId: z.string().min(1, {
    message: "Room Id size should be > 1",
  }),
});

export const leaveMessagetypeZod = z.object({
  event: z.literal("leave"),
  roomId: z.string().min(1, {
    message: "Room Id size should be > 1",
  }),
});

export type TleaveMessagetypeZod = z.infer<typeof leaveMessagetypeZod>;

export const leaveMessageFromRedistypeZod = z.object({
  event: z.literal("leave"),
  userId: z.string().min(1, {
    message: "User Id size should be > 1",
  }),
  roomId: z.string().min(1, {
    message: "Room Id size should be > 1",
  }),
});

const cellModifyTypeZod = z.object({
  event: z.literal("modify-cell"),
  data: z.array(z.number()),
});

export type TcellModifyTypeZod = z.infer<typeof cellModifyTypeZod>;

const initialDataZod = z.object({
  event: z.literal("initial-data"),
  data: z.record(z.string()),
});

export type TinitialDataZod = z.infer<typeof initialDataZod>;

export const initialDataFromRedisZod = z.object({
  event: z.literal("initial-data"),
  data: z.record(z.string()),
});

export type TinitialDataFromRedisZod = z.infer<typeof initialDataFromRedisZod>;

const cellModifyFromRedisTypeZod = z.object({
  event: z.literal("modify-cell"),
  userId: z.string().min(1, {
    message: "User Id size should be > 1",
  }),
  data: z.array(z.number()),
});

export const messageTypeZod = z.union([
  joinMesssageTypeZod,
  cellModifyTypeZod,
  leaveMessagetypeZod,
  initialDataZod,
]);

export type TmessageTypeZod = z.infer<typeof messageTypeZod>;

export const messageFromRedisTypeZod = z.union([
  initialDataFromRedisZod,
  cellModifyFromRedisTypeZod,
  joinMesssageFromRedisTypeZod,
  leaveMessageFromRedistypeZod,
]);

export type TmessageFromRedisTypeZod = z.infer<typeof messageFromRedisTypeZod>;
