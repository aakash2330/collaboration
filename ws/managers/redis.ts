import { createClient, RedisClientType } from "redis";
import { RedisPersistence } from "y-redis";
import * as Y from "yjs";

export class RedisManager {
  private publisher: RedisClientType;
  private persistenceClient: RedisClientType;
  private static instance: RedisManager;
  private redisPersistence: RedisPersistence;

  constructor() {
    this.publisher = createClient();
    this.publisher.connect();
    this.persistenceClient = createClient();
    this.persistenceClient.connect();
    this.redisPersistence = new RedisPersistence({
      redisOpts: this.persistenceClient,
    });
  }
  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public publish({ channel, message }: { message: string; channel: string }) {
    this.publisher.publish(channel, message);
  }
  public bindYdocToRedis({ channel, ydoc }: { channel: string; ydoc: Y.Doc }) {
    this.redisPersistence.bindState(channel, ydoc);
  }
}
