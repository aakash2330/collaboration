import { WebSocketServer } from "ws";
import { User } from "./managers/user";
import "dotenv/config";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
  new User({ ws });
});
