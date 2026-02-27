import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  router,
} from "./_core/trpc";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    /** Check if the current authenticated user's email is on the whitelist */
    whitelistStatus: protectedProcedure.query(async ({ ctx }) => {
      const email = ctx.user.email;
      if (!email) {
        return { whitelisted: false, isAdmin: false, email: null };
      }
      const whitelisted = await db.isEmailWhitelisted(email);
      const isAdmin = db.isAdminEmail(email);
      return { whitelisted, isAdmin, email };
    }),
  }),

  /** Access request endpoints — any authenticated user can submit */
  accessRequest: router({
    submit: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Valid email is required"),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Check if already whitelisted
        const alreadyWhitelisted = await db.isEmailWhitelisted(input.email);
        if (alreadyWhitelisted) {
          return { success: true, message: "You are already approved." };
        }

        // Check for existing pending request
        const hasPending = await db.hasExistingPendingRequest(input.email);
        if (hasPending) {
          return {
            success: true,
            message: "Your request is already pending review.",
          };
        }

        const id = await db.createAccessRequest({
          name: input.name,
          email: input.email.toLowerCase().trim(),
          reason: input.reason ?? null,
        });

        // Notify admin via built-in notification system
        try {
          await notifyOwner({
            title: "New Access Request — Strategic Network",
            content: `${input.name} (${input.email}) has requested access.\n\nReason: ${input.reason || "No reason provided"}\n\nLog in to the admin panel to approve or deny.`,
          });
        } catch (err) {
          console.warn("[AccessRequest] Failed to notify owner:", err);
        }

        return { success: true, message: "Your request has been submitted." };
      }),

    /** Check if current user has a pending request */
    myStatus: protectedProcedure.query(async ({ ctx }) => {
      const email = ctx.user.email;
      if (!email) return { hasPending: false };
      const hasPending = await db.hasExistingPendingRequest(email);
      return { hasPending };
    }),
  }),

  /** Admin-only endpoints */
  admin: router({
    /** List all access requests (optionally filter by status) */
    listRequests: adminProcedure
      .input(
        z
          .object({
            status: z.enum(["pending", "approved", "denied"]).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return db.getAccessRequests(input?.status);
      }),

    /** Approve an access request — adds email to whitelist */
    approveRequest: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const request = await db.getAccessRequestById(input.id);
        if (!request) {
          throw new Error("Access request not found");
        }

        if (request.status !== "pending") {
          throw new Error(`Request already ${request.status}`);
        }

        // Add to whitelist
        await db.addToWhitelist({
          email: request.email,
          name: request.name,
          approvedBy: ctx.user.email ?? "admin",
        });

        // Update request status
        await db.updateAccessRequestStatus(
          input.id,
          "approved",
          ctx.user.email ?? "admin"
        );

        return { success: true };
      }),

    /** Deny an access request */
    denyRequest: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const request = await db.getAccessRequestById(input.id);
        if (!request) {
          throw new Error("Access request not found");
        }

        if (request.status !== "pending") {
          throw new Error(`Request already ${request.status}`);
        }

        await db.updateAccessRequestStatus(
          input.id,
          "denied",
          ctx.user.email ?? "admin"
        );

        return { success: true };
      }),

    /** List all whitelisted emails */
    listWhitelist: adminProcedure.query(async () => {
      return db.getAllWhitelistEntries();
    }),

    /** Manually add an email to the whitelist */
    addWhitelist: adminProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.addToWhitelist({
          email: input.email,
          name: input.name ?? null,
          approvedBy: ctx.user.email ?? "admin",
        });
        return { success: true };
      }),

    /** Remove an email from the whitelist */
    removeWhitelist: adminProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        // Don't allow removing the admin
        if (db.isAdminEmail(input.email)) {
          throw new Error("Cannot remove the primary admin from the whitelist");
        }
        await db.removeFromWhitelist(input.email);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
