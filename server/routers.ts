import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";
import {
  getAllContacts, getContactById,
  isEmailWhitelisted, getAllWhitelistEntries, addToWhitelist, removeFromWhitelist,
  createAccessRequest, getAllAccessRequests, getPendingAccessRequests,
  updateAccessRequestStatus, hasExistingPendingRequest,
  getNotesByContactId, addMeetingNote, deleteMeetingNote, getMeetingNoteById,
  logAudit, getAuditLog,
} from "./db";

const ADMIN_EMAIL = "Powelljohn9521@gmail.com";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    /** Check if the current user's email is whitelisted */
    checkAccess: protectedProcedure.query(async ({ ctx }) => {
      const email = ctx.user.email;
      if (!email) return { whitelisted: false, isAdmin: false };
      const whitelisted = await isEmailWhitelisted(email);
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      return { whitelisted, isAdmin };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════
  // CONTACTS
  // ═══════════════════════════════════════════════════════════════════

  contacts: router({
    list: protectedProcedure.query(async () => {
      return getAllContacts();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const contact = await getContactById(input.id);
        // Log profile view
        if (contact && ctx.user.email) {
          await logAudit("profile_view", ctx.user.email, ctx.user.name ?? null, "contact", input.id, contact.name);
        }
        return contact;
      }),
  }),

  // ═══════════════════════════════════════════════════════════════════
  // ACCESS REQUESTS
  // ═══════════════════════════════════════════════════════════════════

  accessRequests: router({
    submit: protectedProcedure
      .input(z.object({ reason: z.string().max(1000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const email = ctx.user.email;
        if (!email) throw new Error("No email on user account");
        const existing = await hasExistingPendingRequest(email);
        if (existing) return { alreadyPending: true };
        await createAccessRequest(email, ctx.user.name ?? null, input.reason ?? null);
        // Notify admin
        try {
          await notifyOwner({
            title: "New Access Request",
            content: `${ctx.user.name ?? email} (${email}) has requested access to Strategic Network Intelligence.\n\nReason: ${input.reason || "No reason provided"}`,
          });
        } catch (_) { /* non-critical */ }
        return { alreadyPending: false };
      }),
    myStatus: protectedProcedure.query(async ({ ctx }) => {
      const email = ctx.user.email;
      if (!email) return null;
      const pending = await hasExistingPendingRequest(email);
      return { hasPending: pending };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════
  // MEETING NOTES
  // ═══════════════════════════════════════════════════════════════════

  notes: router({
    listByContact: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ input }) => {
        return getNotesByContactId(input.contactId);
      }),
    add: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        noteType: z.enum(["meeting", "call", "email", "follow_up", "general"]),
        content: z.string().min(1).max(10000),
      }))
      .mutation(async ({ ctx, input }) => {
        const note = await addMeetingNote(
          input.contactId, ctx.user.email!, ctx.user.name ?? null,
          input.noteType, input.content,
        );
        await logAudit("note_added", ctx.user.email!, ctx.user.name ?? null, "contact", input.contactId, `Note #${note.id}: ${input.noteType}`);
        return note;
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const note = await getMeetingNoteById(input.id);
        if (!note) throw new Error("Note not found");
        await deleteMeetingNote(input.id);
        await logAudit("note_deleted", ctx.user.email!, ctx.user.name ?? null, "contact", note.contactId, `Note #${input.id}: ${note.noteType}`);
        return { success: true };
      }),
  }),

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════════════════════════════

  admin: router({
    // Whitelist management
    whitelist: router({
      list: adminProcedure.query(async () => getAllWhitelistEntries()),
      add: adminProcedure
        .input(z.object({ email: z.string().email() }))
        .mutation(async ({ ctx, input }) => {
          await addToWhitelist(input.email, ctx.user.email!);
          await logAudit("whitelist_added", ctx.user.email!, ctx.user.name ?? null, "whitelist", undefined, input.email);
          return { success: true };
        }),
      remove: adminProcedure
        .input(z.object({ email: z.string().email() }))
        .mutation(async ({ ctx, input }) => {
          await removeFromWhitelist(input.email);
          await logAudit("whitelist_removed", ctx.user.email!, ctx.user.name ?? null, "whitelist", undefined, input.email);
          return { success: true };
        }),
    }),

    // Access request management
    requests: router({
      list: adminProcedure.query(async () => getAllAccessRequests()),
      pending: adminProcedure.query(async () => getPendingAccessRequests()),
      approve: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          // Get request to find email
          const requests = await getAllAccessRequests();
          const req = requests.find(r => r.id === input.id);
          if (!req) throw new Error("Request not found");
          await updateAccessRequestStatus(input.id, "approved", ctx.user.email!);
          // Auto-add to whitelist
          await addToWhitelist(req.email, ctx.user.email!);
          await logAudit("access_approved", ctx.user.email!, ctx.user.name ?? null, "access_request", input.id, req.email);
          return { success: true };
        }),
      deny: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const requests = await getAllAccessRequests();
          const req = requests.find(r => r.id === input.id);
          if (!req) throw new Error("Request not found");
          await updateAccessRequestStatus(input.id, "denied", ctx.user.email!);
          await logAudit("access_denied", ctx.user.email!, ctx.user.name ?? null, "access_request", input.id, req.email);
          return { success: true };
        }),
    }),

    // Audit log
    auditLog: router({
      list: adminProcedure
        .input(z.object({
          action: z.enum(["profile_view", "note_added", "note_deleted", "access_approved", "access_denied", "whitelist_added", "whitelist_removed"]).optional(),
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(100).default(25),
        }))
        .query(async ({ input }) => {
          const offset = (input.page - 1) * input.pageSize;
          return getAuditLog({ action: input.action, limit: input.pageSize, offset });
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
