import { useWebSocket } from "@/ws/provider";
import { useEffect, useMemo } from "react";
import * as Y from "yjs";

export function useYdoc() {
  const { message, sendWsMessage } = useWebSocket();

  const ydoc = useMemo(() => {
    return new Y.Doc();
  }, []);

  useEffect(() => {
    if (message?.event == "modify-cell") {
      ydoc.transact(() => {
        console.log("silently applying update");
        Y.applyUpdate(ydoc, new Uint8Array(message.data));
      }, "silent");
    }

    // get initial data from the room's doc
    if (message?.event == "initial-data") {
      Object.entries(message.data).forEach(([key, value]) => {
        ydoc.getMap().set(key, value);
      });
    }
  }, [message, ydoc]);

  useEffect(() => {
    ydoc.on(
      "update",
      (update, origin: "silent" | "non-silent" = "non-silent") => {
        if (origin === "silent") {
          console.log("Silently Received update:", { update, origin });
          return;
        }
        console.log("Received Non-silent update:", { update, origin });
        console.log({ update });

        sendWsMessage({
          event: "modify-cell",
          data: Array.from(update),
        });
      },
    );
    return () => {
      ydoc.destroy();
    };
  }, [ydoc, sendWsMessage]);

  return { ydoc };
}
