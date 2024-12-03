import { env } from "@/env";
import { type TmessageTypeZod } from "@/validators/messages";

export class WebSocketManager {
  public ws: WebSocket;
  public static instance: WebSocketManager;
  private initialised: boolean;
  private bufferedMessages: TmessageTypeZod[];

  constructor() {
    this.ws = new WebSocket(env.NEXT_PUBLIC_WS_URL);
    this.initialised = false;
    this.bufferedMessages = [];
    this.initHandlers();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new WebSocketManager();
    }
    return this.instance;
  }

  public initHandlers() {
    this.ws.onopen = () => {
      this.initialised = true;
      console.log({ bufferedMessages: this.bufferedMessages });
      this.bufferedMessages.forEach((message) => {
        this.ws.send(JSON.stringify(message));
      });
      this.bufferedMessages = [];
    };
    this.ws.onclose = () => console.log("WebSocket disconnected");
    this.ws.onerror = (error) => console.error("WebSocket error:", error);
  }

  // TODO: if not ready , add messages to a queue and send one by one when ready
  public sendMessage = (message: TmessageTypeZod): void => {
    if (!this.initialised) {
      this.bufferedMessages.push(message);
      return;
    }
    this.ws.send(JSON.stringify(message));
  };
}
