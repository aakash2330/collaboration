import { z } from "zod";

export const shareWorkspaceOutputZod = z.object({ shareableUrl: z.string() })
