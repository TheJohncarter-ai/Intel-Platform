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
        const alreadyWhitelisted = await db.isEmailWhitelisted(input.email);
        if (alreadyWhitelisted) {
          return { success: true, message: "You are already approved." };
        }

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

    myStatus: protectedProcedure.query(async ({ ctx }) => {
      const email = ctx.user.email;
      if (!email) return { hasPending: false };
      const hasPending = await db.hasExistingPendingRequest(email);
      return { hasPending };
    }),
  }),

  /** Contact notes — relationship notes, meeting logs, follow-up tasks */
  notes: router({
    /** List all notes for a specific contact */
    list: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ input }) => {
        return db.getContactNotes(input.contactId);
      }),

    /** Create a new note on a contact */
    create: protectedProcedure
      .input(
        z.object({
          contactId: z.number(),
          contactName: z.string(),
          noteType: z.enum(["meeting", "interaction", "follow_up", "general"]),
          content: z.string().min(1, "Note content is required"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const noteId = await db.createContactNote({
          contactId: input.contactId,
          contactName: input.contactName,
          userId: ctx.user.id,
          userName: ctx.user.name ?? "Unknown",
          userEmail: ctx.user.email ?? "unknown",
          noteType: input.noteType,
          content: input.content,
        });

        // Log to audit trail
        await db.createAuditEntry({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "Unknown",
          userEmail: ctx.user.email ?? "unknown",
          action: "note_added",
          contactId: input.contactId,
          contactName: input.contactName,
          metadata: JSON.stringify({
            noteType: input.noteType,
            preview: input.content.substring(0, 100),
            noteId,
          }),
        });

        return { success: true, id: noteId };
      }),

    /** Delete a note (only the author or admin can delete) */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const note = await db.getContactNoteById(input.id);
        if (!note) {
          throw new Error("Note not found");
        }

        // Only the author or admin can delete
        const isAdmin = db.isAdminEmail(ctx.user.email);
        if (note.userId !== ctx.user.id && !isAdmin) {
          throw new Error("You can only delete your own notes");
        }

        await db.deleteContactNote(input.id);

        // Log to audit trail
        await db.createAuditEntry({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "Unknown",
          userEmail: ctx.user.email ?? "unknown",
          action: "note_deleted",
          contactId: note.contactId,
          contactName: note.contactName,
          metadata: JSON.stringify({
            noteType: note.noteType,
            deletedNoteId: input.id,
          }),
        });

        return { success: true };
      }),
  }),

  /** Audit log — track profile views */
  audit: router({
    /** Log a profile view (called by the frontend when a profile is opened) */
    logView: protectedProcedure
      .input(
        z.object({
          contactId: z.number(),
          contactName: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.createAuditEntry({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "Unknown",
          userEmail: ctx.user.email ?? "unknown",
          action: "profile_view",
          contactId: input.contactId,
          contactName: input.contactName,
        });
        return { success: true };
      }),
  }),

  /** Admin-only endpoints */
  admin: router({
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

        await db.addToWhitelist({
          email: request.email,
          name: request.name,
          approvedBy: ctx.user.email ?? "admin",
        });

        await db.updateAccessRequestStatus(
          input.id,
          "approved",
          ctx.user.email ?? "admin"
        );

        return { success: true };
      }),

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

    listWhitelist: adminProcedure.query(async () => {
      return db.getAllWhitelistEntries();
    }),

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

    removeWhitelist: adminProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        if (db.isAdminEmail(input.email)) {
          throw new Error("Cannot remove the primary admin from the whitelist");
        }
        await db.removeFromWhitelist(input.email);
        return { success: true };
      }),

    /** Audit log — admin only */
    auditLog: adminProcedure
      .input(
        z
          .object({
            action: z
              .enum(["profile_view", "note_added", "note_deleted"])
              .optional(),
            limit: z.number().min(1).max(200).optional(),
            offset: z.number().min(0).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return db.getAuditLog({
          action: input?.action,
          limit: input?.limit ?? 50,
          offset: input?.offset ?? 0,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
