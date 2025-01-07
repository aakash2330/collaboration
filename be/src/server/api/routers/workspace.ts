import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import _ from "lodash";
import { env } from "@/env";
import { createId } from "@paralleldrive/cuid2";
import { shareWorkspaceOutputZod } from "@/validators/workspace";

export const workspaceRouter = createTRPCRouter({
  getWorksheetDataById: protectedProcedure
    .input(z.object({ workspaceId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const workspace = await ctx.db.workspace.findFirst({
        where: { id: input.workspaceId },
        //include: { tables: { select: { name: true } } },
      });

      if (!workspace) {
        throw new Error(
          `Unable to find workspace with Id ${input.workspaceId}`,
        );
      }
      return { data: workspace };
    }),

  getWorksheetDataByInvitationToken: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.db.invitation.findFirst({
        where: { token: input.token },
        include: {
          workspace: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new Error(`Unable to find invitation with token ${input.token}`);
      }
      return { data: invitation };
    }),

  getWorksheetTablesById: protectedProcedure
    .input(z.object({ workspaceId: z.string().min(1).nullable() }))
    .query(async ({ ctx, input }) => {
      if (!input.workspaceId) {
        return null;
      }
      const workspaceTables = await ctx.db.workspace.findFirst({
        where: { id: input.workspaceId },
        select: { tables: { select: { id: true, name: true } } },
      });

      if (!workspaceTables) {
        throw new Error(
          `Unable to find workspace with Id ${input.workspaceId}`,
        );
      }
      return { data: workspaceTables };
    }),

  getAllWorkspacesList: protectedProcedure.query(async ({ ctx }) => {
    const workspacesList = await ctx.db.workspace.findMany({
      where: {
        OR: [
          { ownerId: ctx.session.user.id },
          { members: { some: { id: ctx.session.user.id } } },
        ],
      },
      // so that when the user navigates to workspace page , they land on the first table , eventually this would be last interacted table
      include: { tables: { take: 1, select: { id: true } } },
    });

    return workspacesList ?? null;
  }),

  createWorkspace: protectedProcedure
    .input(z.object({ workspaceName: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const createdWorkspace = await ctx.db.workspace.create({
        data: {
          name: input.workspaceName,
          ownerId: ctx.session.user.id,
        },
      });
      if (!createdWorkspace) {
        throw new Error("Workspace Creation Error");
      }
      return { data: { success: true } };
    }),

  // currently only the owner can create invitations
  shareWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string().min(1) }))
    .output(shareWorkspaceOutputZod)
    .mutation(async ({ ctx, input }) => {
      //check if workspace exists and if user owns it
      const workspaceExists = await ctx.db.workspace.findFirst({
        where: {
          id: input.workspaceId,
          ownerId: ctx.session.user.id,
        },
      });
      if (_.isEmpty(workspaceExists)) {
        throw new Error("Workspace Doesn't exist");
      }
      // create a new invitation
      const invitation = await ctx.db.invitation.create({
        data: {
          workspaceId: input.workspaceId,
          invitedById: ctx.session.user.id,
          expiresAt: new Date(new Date().getTime() + env.LINK_EXPIRE_DURATION),
          token: createId(),
        },
      });

      if (_.isEmpty(invitation)) {
        throw new Error("Unable to create an Invitation");
      }

      const shareableUrl = `${env.NEXT_PUBLIC_URL}/workspace/join/${invitation.token}`;
      return { shareableUrl };
    }),

  acceptWorkspaceInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // get the invatation
      const invitation = await ctx.db.invitation.findFirst({
        where: {
          token: input.token,
        },
        include: {
          workspace: {
            select: { id: true },
          },
        },
      });
      if (!invitation) {
        throw new Error("Invitation Not found");
      }
      if (invitation.expiresAt.getTime() < new Date().getTime()) {
        throw new Error("Invitation Expired");
      }
      if (invitation.invitedById === ctx.session.user.id) {
        throw new Error("User created the invitaion , can't accept");
      }
      await ctx.db.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          sharedWorkspaces: {
            connect: { id: invitation.workspace.id },
          },
        },
      });
      return { data: { success: true, workspaceId: invitation.workspace.id } };
    }),
});
