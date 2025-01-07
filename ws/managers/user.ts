import _ from "lodash";
import { verifySessionAndGetUserId } from "../lib/verify-session";
import { createId } from "@paralleldrive/cuid2";
import {
  messageTypeZod,
  TcellModifyTypeZod,
  TjoinMessageTypeZod,
  TleaveMessagetypeZod,
  TmessageTypeZod,
} from "../types/message";
import { WebSocket } from "ws";
import { RedisManager } from "./redis";
import { RoomManager } from "./room";

export class User {
  private ws: WebSocket;
  public roomId: string | undefined;
  public userId: string | undefined;
  public id: string;

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
    this.initHandlers();
    this.id = createId();
  }

  public initHandlers() {
    this.ws.on("open", () => {
      console.log("ws connection established");
      console.log(JSON.stringify(this.ws));
      this.ws.send("connected");
    });
    this.ws.on("error", () => {
      this.ws.close();
      console.log("ERROR");
    });
    this.ws.on("close", () => {
      if (this.roomId) {
        this.handleLeaveUser({ event: "leave", roomId: this.roomId });
      }
      this.ws.close();
    });

    this.ws.on("message", async (data) => {
      console.log("received -", JSON.parse(data.toString()));
      try {
        const jsonifiedData = JSON.parse(data.toString());
        const messageData = messageTypeZod.safeParse(jsonifiedData);
        if (!messageData.success) {
          throw new Error("unable to parse message");
        }
        const { event } = messageData.data;

        switch (event) {
          case "join":
            this.handleUserJoin(messageData.data);
            break;
          case "modify-cell":
            this.handleModifyCell(messageData.data);
            break;
          case "leave":
            this.handleLeaveUser(messageData.data);
            break;
          default:
            this.ws.send("invalid event type");
        }
      } catch (error) {
        console.error("Error in the ws message handler" + error);
      }
    });
  }

  public emit(message: string) {
    this.ws.send(message);
  }

  private handleModifyCell(message: TcellModifyTypeZod) {
    if (!this.roomId) {
      throw new Error("User doesnt belong to a room");
    }

    // you done need to the changes , just apply the updates to the doc and it'll automatically publish the updated document , because we used redis persistance from y-redis
    RedisManager.getInstance().publish({
      message: JSON.stringify({ ...message, userId: this.userId }),
      channel: this.roomId,
    });
    //publish as well as add in a queue
    //after every 10 second interval , empty the queue and operation transform those results
    //reslts to db
  }

  private async handleUserJoin(message: TjoinMessageTypeZod) {
    const { token, roomId } = message;

    //find userId associate to the token
    const userId = await verifySessionAndGetUserId(token);
    if (_.isEmpty(userId)) {
      throw new Error("No UserId Found");
    }
    this.userId = userId;
    // add user to the room
    RoomManager.getInstance().addUser({ user: this, roomId });

    if (!this.roomId) {
      throw new Error("User doesnt belong to a room");
    }

    RedisManager.getInstance().publish({
      message: JSON.stringify({ ...message, userId: this.userId }),
      channel: this.roomId,
    });
  }

  private async handleLeaveUser(message: TleaveMessagetypeZod) {
    const { roomId } = message;
    RoomManager.getInstance().removeUser({ user: this, roomId });

    if (this.roomId) {
      throw new Error(`Couldn't remove user from the room ${roomId}`);
    }

    RedisManager.getInstance().publish({
      message: JSON.stringify({ ...message, userId: this.userId }),
      channel: roomId,
    });
  }
}
