import { User } from "./user";
import _ from "lodash";
import {
  messageFromRedisTypeZod,
  TmessageFromRedisTypeZod,
} from "../types/message";
import { createClient, RedisClientType } from "redis";

export class RoomManager {
  private rooms: Map<string, User[]>;
  private static instance: RoomManager;
  private subscriber: RedisClientType;

  constructor() {
    this.rooms = new Map();
    this.subscriber = createClient();
    this.subscriber.connect();
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
        return;
      }
      RoomManager.getInstance().broadcastMessageToUsersInRoom({
        roomId: channel,
        message: parsedMessage.data,
      });
    });
  }

  public unsubscribe({ channel }: { channel: string }) {
    this.subscriber.unsubscribe(channel);
  }

  public addUser({ user, roomId }: { user: User; roomId: string }) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, [user]);
      this.subscribe({ channel: roomId });
      console.log(`subscribing to channel ${roomId} `);
    } else {
      //also check if user is already part of that praticular
      const users = this.rooms.get(roomId);
      if (users) {
        const foundUser = users.find((u) => u.id === user.id);
        if (foundUser) {
          console.error("user is already there in the room");
          return;
        } else {
          this.rooms.get(roomId)?.push(user);
        }
      }
    }
    // associate the user to that roomId
    user.roomId = roomId;
    return;
  }

  //room id required in case we allow a user to be a part of multiple rooms
  public removeUser({ user, roomId }: { user: User; roomId: string }) {
    if (!this.rooms.has(roomId)) {
      console.log(`no room present with roomId - ${roomId}`);
      return;
    }
    const users = this.rooms.get(roomId);

    if (!users) {
      console.log(`no users present in roomId - ${roomId}`);
      return;
    }
    const filteredUsers = users.filter((u) => u.id !== user.id);
    user.roomId = undefined;

    if (_.isEmpty(filteredUsers)) {
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
    this.rooms.set(roomId, filteredUsers);
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
    const users = this.rooms.get(roomId);

    if (!users) {
      console.log(`no users present in roomId - ${roomId}`);
      return;
    }
    //NOTE:Should this be ?
    //  users.forEach((u) => {
    //    if (message.userId !== u.userId) {
    //      u.emit(JSON.stringify(message));
    //    }
    //  });

    users.forEach((u) => {
      u.emit(JSON.stringify(message));
    });
  }
}
