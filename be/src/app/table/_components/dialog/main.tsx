import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type ReactNode } from "react";
export function DialogMain({
  trigger,
  content,
  title,
}: {
  trigger: ReactNode;
  content: ReactNode;
  title: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {content}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
