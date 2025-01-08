import { createClient, RedisClientType } from "redis";

export class RedisManager {
  private publisher: RedisClientType;
  private static instance: RedisManager;

  constructor() {
    this.publisher = createClient();
    this.publisher.connect();
  }
  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public publish({ channel, message }: { message: string; channel: string }) {
    //parse whatever is being published here
    this.publisher.publish(channel, message);
  }
}
