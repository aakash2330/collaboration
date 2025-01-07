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
        ydoc.getMap().set(message.data.cellId, message.data.value);
      }, "silent");
    }
  }, [message, ydoc]);

  useEffect(() => {
    ydoc.on(
      "update",
      (update, origin: "silent" | "non-silent" = "non-silent") => {
        console.log("Silently Received update:", { update, origin });
        if (origin === "silent") {
          return;
        }
        sendWsMessage({
          event: "modify-cell",
          data: update,
        });
      },
    );
    return () => {
      ydoc.destroy();
    };
  }, [ydoc, sendWsMessage]);

  return { ydoc };
}
