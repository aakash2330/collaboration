import { User } from "./user";
import _ from "lodash";
import * as Y from "yjs";
import {
  messageFromRedisTypeZod,
  TmessageFromRedisTypeZod,
} from "../types/message";
import { createClient, RedisClientType } from "redis";
import { RedisManager } from "./redis";
import { db } from "../prisma/prisma-client";
import { Cell } from "@prisma/client";

export class RoomManager {
  private rooms: Map<string, { ydoc: Y.Doc; users: User[] }>;
  private static instance: RoomManager;
  private subscriber: RedisClientType;
  private redisClient: RedisClientType;

  constructor() {
    this.rooms = new Map();
    this.subscriber = createClient();
    this.subscriber.connect();

    this.redisClient = createClient();
    this.redisClient.connect();
  }
  public static getInstance() {
    if (!this.instance) {
      this.instance = new RoomManager();
    }
    return this.instance;
  }

  public subscribe({ channel }: { channel: string }) {
    this.subscriber.subscribe(channel, (message: string) => {
      const parsedMessage = messageFromRedisTypeZod.safeParse(
        JSON.parse(message),
      );

      if (!parsedMessage.success) {
        console.log(JSON.stringify(parsedMessage.error));
        return;
      }
      RoomManager.getInstance().broadcastMessageToUsersInRoom({
        roomId: channel,
        message: parsedMessage.data,
      });
      if (parsedMessage.data.event == "join") {
      }
    });
  }

  public unsubscribe({ channel }: { channel: string }) {
    this.subscriber.unsubscribe(channel);
  }

  public async addUser({ user, roomId }: { user: User; roomId: string }) {
    if (!this.rooms.has(roomId)) {
      const ydoc = new Y.Doc();
      //check if the instance is already bound

      this.subscribe({ channel: roomId });
      console.log(`subscribing to channel ${roomId} `);

      this.rooms.set(roomId, {
        // the first time a room is created , a new ydoc is attached to it which is shared by all the users to perform updates , which is also synched with redis persistance from y-redis
        ydoc: ydoc,
        users: [user],
      });
    } else {
      //also check if user is already part of that praticular
      const roomData = this.rooms.get(roomId);
      if (roomData?.users) {
        const foundUser = roomData.users.find((u) => u.id === user.id);
        if (foundUser) {
          console.error("user is already there in the room");
          return;
        } else {
          this.rooms.get(roomId)?.users.push(user);
        }
      }
    }
    // associate the user to that roomId
    user.roomId = roomId;

    // also send the doc udpates to the user
    user.emit(
      JSON.stringify({
        event: "initial-data",
        //maybe replace this with getStateAsUpdade function from yjs
        data: this.rooms.get(roomId)?.ydoc.getMap(),
      }),
    );

    console.log(`here is the room id ${roomId}`);
    return;
  }

  //room id required in case we allow a user to be a part of multiple rooms
  public async removeUser({ user, roomId }: { user: User; roomId: string }) {
    if (!this.rooms.has(roomId)) {
      console.log(`no room present with roomId - ${roomId}`);
      return;
    }
    const roomData = this.rooms.get(roomId);

    if (!roomData?.users) {
      console.log(`no users present in roomId - ${roomId}`);
      return;
    }
    const filteredUsers = roomData.users.filter((u) => u.id !== user.id);
    user.roomId = undefined;

    if (_.isEmpty(filteredUsers)) {
      //after the room has no users , just dump the updates in db
      const ydoc = this.rooms.get(roomId)?.ydoc;
      ydoc && (await dumpDocUpdatesToDb(ydoc.getMap().toJSON()));

      this.rooms.delete(roomId);
      this.unsubscribe({ channel: roomId });
      console.log(
        `unsubscribing room ${roomId} as room ${roomId} has ${filteredUsers.length} users`,
      );
      //send leave room message manually cause no room left to broadcast messsage to
      user.emit(
        JSON.stringify({ event: "leave", roomId: roomId, userId: user.userId }),
      );
      return;
    }
    this.rooms.set(roomId, { ...roomData, users: filteredUsers });
  }

  public getYdocByRoomId(roomId: string): Y.Doc | undefined {
    return this.rooms.get(roomId)?.ydoc;
  }

  //this function is to be passed to the redis so it can use it as a callback
  public broadcastMessageToUsersInRoom({
    roomId,
    message,
  }: {
    roomId: string;
    message: TmessageFromRedisTypeZod;
  }) {
    //check if room Id exists and has users
    //parse the message and check if it has the correct shape

    if (!this.rooms.has(roomId)) {
      return;
    }
    const roomData = this.rooms.get(roomId);

    if (!roomData?.users) {
      console.log(`no users present in roomId - ${roomId}`);
      return;
    }
    //NOTE:Should this be ?
    //  users.forEach((u) => {
    //    if (message.userId !== u.userId) {
    //      u.emit(JSON.stringify(message));
    //    }
    //  });

    roomData.users.forEach((u) => {
      u.emit(JSON.stringify(message));
    });
  }
}

async function dumpDocUpdatesToDb(data: Record<string, string>) {
  console.log("dumping updates to db");
  const transactionPromises: Promise<Cell>[] = [];

  await db.$transaction(async (prisma) => {
    Object.entries(data).forEach(async ([cellId, value]) => {
      transactionPromises.push(
        prisma.cell.update({
          where: { id: cellId },
          data: { value },
        }),
      );
    });
    await Promise.all(transactionPromises);
  });
}
