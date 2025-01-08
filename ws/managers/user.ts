import _ from "lodash";
import { verifySessionAndGetUserId } from "../lib/verify-session";
import { createId } from "@paralleldrive/cuid2";
import * as Y from "yjs";
import {
  messageTypeZod,
  TcellModifyTypeZod,
  TjoinMessageTypeZod,
  TleaveMessagetypeZod,
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
    // parse the message before sending
    this.ws.send(message);
  }

  private handleModifyCell(message: TcellModifyTypeZod) {
    if (!this.roomId) {
      console.log("User doesnt belong to a room");
      return;
    }

    // find the room -> ydoc that the current user is a part of
    const ydoc = RoomManager.getInstance().getYdocByRoomId(this.roomId);
    ydoc && Y.applyUpdate(ydoc, new Uint8Array(message.data));

    RedisManager.getInstance().publish({
      message: JSON.stringify({ ...message, userId: this.userId }),
      channel: this.roomId,
    });
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
    await RoomManager.getInstance().addUser({ user: this, roomId });

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

//code snippet to convert uint8 array to a normal string
//const uint8ArrayValues = Object.values(update);
//const byteArray = new Uint8Array(uint8ArrayValues);

//// Step 2: Decode the Uint8Array to a string
//const decoder = new TextDecoder("utf-8"); // Use UTF-8 encoding
//const decodedString = decoder.decode(byteArray);

//// Output the decoded string
//console.log({ decodedString });
