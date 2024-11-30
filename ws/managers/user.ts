import _ from "lodash";
import { verifySessionAndGetUserId } from "../lib/verify-session";
import { messageTypeZod } from "../types/message";
import { room } from "./room";
import { WebSocket } from "ws";

export class User {
  private ws: WebSocket;
  private userId: string | undefined;
  private roomId: string | undefined;
  constructor({
    ws,
    userId,
    roomId,
  }: {
    ws: WebSocket;
    userId?: string;
    roomId?: string;
  }) {
    this.ws = ws;
    this.roomId = roomId;
    this.userId = userId;
  }

  initHandlers() {
    this.ws.on("error", () => {
      this.ws.close();
      console.log("ERROR");
    });

    this.ws.on("message", function message(data) {
      console.log("received -", data);
      try {
      } catch (error) {
        console.log({ error });
      }
      const jsonifiedData = JSON.parse(data.toString());
      const messageData = messageTypeZod.safeParse(jsonifiedData);
      if (messageData.data?.event == "join") {
        const { token } = messageData.data;

        const userId = verifySessionAndGetUserId(token);
        if (_.isEmpty(userId)) {
          throw new Error("No UserId Found");
        }

        //find user with the given token
      }
      this.send("message recieved");
    });
  }
}
