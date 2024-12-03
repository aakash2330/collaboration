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
  data: z.object({
    cellId: z.string().min(1, {
      message: "Cell Id size should be > 1",
    }),
    sheetId: z.string().min(1, {
      message: "Sheet Id size should be > 1",
    }),
    value: z.string(),
  }),
});

export type TcellModifyTypeZod = z.infer<typeof cellModifyTypeZod>;

const cellModifyFromRedisTypeZod = z.object({
  event: z.literal("modify-cell"),
  userId: z.string().min(1, {
    message: "User Id size should be > 1",
  }),
  data: z.object({
    cellId: z.string().min(1, {
      message: "Cell Id size should be > 1",
    }),
    sheetId: z.string().min(1, {
      message: "Sheet Id size should be > 1",
    }),
    value: z.string(),
  }),
});

export const messageTypeZod = z.union([
  joinMesssageTypeZod,
  cellModifyTypeZod,
  leaveMessagetypeZod,
]);

export type TmessageTypeZod = z.infer<typeof messageTypeZod>;

export const messageFromRedisTypeZod = z.union([
  cellModifyFromRedisTypeZod,
  joinMesssageFromRedisTypeZod,
  leaveMessageFromRedistypeZod,
]);

export type TmessageFromRedisTypeZod = z.infer<typeof messageFromRedisTypeZod>;
