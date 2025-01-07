import { createClient, RedisClientType } from "redis";

export class QueueManager {
  private static instance: QueueManager;
  private activeQueues: Set<string>;
  private redisClient: RedisClientType;

  constructor() {
    this.activeQueues = new Set<string>();
    this.redisClient = createClient();
    this.redisClient.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new QueueManager();
    }
    return this.instance;
  }
  //  private addToQueue({ name, message }: { name: string; message: string }) {
  //    this.redisClient.lPush(name, message);
  //    this.activeQueues.add(name);
  //  }
  //  private async pullFromQueue() {
  //    for (const name of this.activeQueues) {
  //      const elements = await this.redisClient.lRange(name, 0, -1);
  //
  //      console.log(`transforming and storing elements ${elements}`);
  //
  //      const finalState = performOt([{ cellId: "test", value: "test" }]);
  //      await saveToDb([{ cellId: "test", value: "test" }]);
  //
  //      this.activeQueues.delete(name);
  //    }
  //  }
  //  public initIntervalQueue() {
  //    setInterval(this.pullFromQueue, 5000);
  //  }
}

function performOt(elements: { cellId: string; value: string }[]) {
  return;
}
//async function saveToDb(finalState: { cellId: string; value: string }[]) {
//  return;
//}
