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

const cellModifyTypeZod = z.object({
  event: z.literal("cell-modify"),
  data: z.object({
    cellId: z.string().min(1, {
      message: "Cell Id size should be > 1",
    }),
    value: z.string(),
  }),
});

export const messageTypeZod = z.union([joinMesssageTypeZod, cellModifyTypeZod]);
