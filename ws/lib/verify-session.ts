import { db } from "../prisma/prisma-client";
import _ from "lodash";

export async function verifySessionAndGetUserId(sessionToken: string) {
  try {
    const session = await db.session.findFirst({
      where: {
        sessionToken,
      },
      select: {
        user: true,
      },
    });
    if (_.isEmpty(session)) {
      throw new Error("Invalid Session Token");
    }
    return session.user.id;
  } catch (error) {
    console.error("Error verifying session Token:", error);
    throw new Error("Invalid ID token");
  }
}
