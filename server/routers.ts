import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import {
  getAllContacts, getContactById, updateContact, setContactResearchedAt, getLastContactedMap,
  setContactLastContacted, getStaleContacts, bulkInsertContacts,
  isEmailWhitelisted, getAllWhitelistEntries, addToWhitelist, removeFromWhitelist,
  createAccessRequest, getAllAccessRequests, getPendingAccessRequests,
  updateAccessRequestStatus, hasExistingPendingRequest,
  getNotesByContactId, addMeetingNote, deleteMeetingNote, getMeetingNoteById,
  logAudit, getAuditLog, getAdminStats,
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
      const [contactsList, lastContactedMap] = await Promise.all([
        getAllContacts(),
        getLastContactedMap(),
      ]);
      return contactsList.map(c => ({
        ...c,
        lastContacted: lastContactedMap.get(c.id) ?? null,
      }));
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const contact = await getContactById(input.id);
        if (contact && ctx.user.email) {
          await logAudit("profile_view", ctx.user.email, ctx.user.name ?? null, "contact", input.id, contact.name);
        }
        return contact;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        role: z.string().optional(),
        organization: z.string().optional(),
        location: z.string().optional(),
        group: z.string().optional(),
        tier: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        notes: z.string().optional(),
        linkedinUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updated = await updateContact(id, data);
        if (ctx.user.email) {
          const fields = Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined);
          await logAudit("contact_updated", ctx.user.email, ctx.user.name ?? null, "contact", id, `Updated: ${fields.join(", ")}`);
        }
        return updated;
      }),

    research: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const contact = await getContactById(input.id);
        if (!contact) throw new Error("Contact not found");

        const prompt = `You are a strategic intelligence analyst. Research and provide a concise intelligence briefing about this person:

Name: ${contact.name}
Role: ${contact.role || "Unknown"}
Organization: ${contact.organization || "Unknown"}
Location: ${contact.location || "Unknown"}

Provide:
1. A brief background summary (2-3 sentences)
2. Their organization's key activities and relevance
3. Recent notable developments or news (if any publicly known)
4. Strategic significance and potential talking points
5. Any known connections to major industry or political networks

Keep it factual, concise, and actionable. Format with clear sections using markdown headers.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a strategic intelligence analyst providing concise, factual briefings on key contacts. Be professional and avoid speculation." },
            { role: "user", content: prompt },
          ],
        });

        const researchContent = String(response.choices?.[0]?.message?.content || "Research unavailable at this time.");

        // Save as a research note
        const note = await addMeetingNote(
          input.id, ctx.user.email!, ctx.user.name ?? null,
          "research", researchContent,
        );

        await setContactResearchedAt(input.id);
        await logAudit("contact_researched", ctx.user.email!, ctx.user.name ?? null, "contact", input.id, contact.name);

        return note;
      }),

    stale: protectedProcedure
      .input(z.object({ daysSince: z.number().min(1).max(365).default(30) }))
      .query(async ({ input }) => {
        return getStaleContacts(input.daysSince);
      }),

    intelligentSearch: protectedProcedure
      .input(z.object({ question: z.string().min(1).max(1000) }))
      .mutation(async ({ input }) => {
        // Gather all contact data + recent notes as context
        const allContacts = await getAllContacts();
        const contactSummaries = await Promise.all(
          allContacts.map(async (c) => {
            const notes = await getNotesByContactId(c.id);
            const recentNotes = notes.slice(0, 3).map(n => `[${n.noteType}] ${n.content.substring(0, 200)}`).join("\n");
            return `[ID:${c.id}] ${c.name} | Role: ${c.role || "N/A"} | Org: ${c.organization || "N/A"} | Location: ${c.location || "N/A"} | Group: ${c.group || "N/A"} | Tier: ${c.tier || "N/A"} | Sector: ${c.sector || "N/A"} | Confidence: ${c.confidence || "N/A"} | Event: ${c.event || "N/A"} | Company: ${c.companyDomain || "N/A"} | Email: ${c.email || "N/A"} | Phone: ${c.phone || "N/A"} | LinkedIn: ${c.linkedinUrl || "N/A"} | Notes: ${c.notes?.substring(0, 300) || "N/A"}${recentNotes ? "\nRecent logs:\n" + recentNotes : ""}`;
          })
        );

        const contextBlock = contactSummaries.join("\n\n");

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an intelligent search assistant for a strategic network intelligence platform. You have access to the user's full contact database. When answering questions, always reference specific contacts by their exact name and include their ID in the format [[ID:number|Name]] so the frontend can create links. Be concise, specific, and actionable. If multiple contacts match, list them all. If no contacts match, say so clearly.`,
            },
            {
              role: "user",
              content: `Here is the full contact database:\n\n${contextBlock}\n\n---\n\nUser question: ${input.question}`,
            },
          ],
        });

        const answer = String(response.choices?.[0]?.message?.content || "I couldn't process that question. Please try rephrasing.");
        return { answer };
      }),

    exportCsv: protectedProcedure.query(async () => {
      const allContacts = await getAllContacts();
      const headers = ["name","role","organization","location","group","tier","email","phone","notes","linkedinUrl"];
      const csvRows = [headers.join(",")];
      for (const c of allContacts) {
        const row = headers.map(h => {
          const val = String((c as any)[h] ?? "");
          // Escape CSV: wrap in quotes if contains comma, quote, or newline
          if (val.includes(",") || val.includes('"') || val.includes("\n")) {
            return '"' + val.replace(/"/g, '""') + '"';
          }
          return val;
        });
        csvRows.push(row.join(","));
      }
      return csvRows.join("\n");
    }),

    importCsv: protectedProcedure
      .input(z.object({ csvContent: z.string().max(500000) }))
      .mutation(async ({ ctx, input }) => {
        // Parse CSV
        const lines = input.csvContent.split("\n").filter(l => l.trim());
        if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");
        const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
        const nameIdx = headers.indexOf("name");
        if (nameIdx === -1) throw new Error("CSV must have a 'name' column");

        const fieldMap: Record<string, string> = {
          name: "name", role: "role", organization: "organization", org: "organization",
          location: "location", country: "location", group: "group", tier: "tier",
          email: "email", phone: "phone", notes: "notes", linkedin: "linkedinUrl", linkedinurl: "linkedinUrl",
        };

        const rows: Array<Record<string, string>> = [];
        for (let i = 1; i < lines.length; i++) {
          // Simple CSV parse (handles quoted fields)
          const values: string[] = [];
          let current = "";
          let inQuotes = false;
          for (const ch of lines[i]) {
            if (ch === '"') { inQuotes = !inQuotes; }
            else if (ch === "," && !inQuotes) { values.push(current.trim()); current = ""; }
            else { current += ch; }
          }
          values.push(current.trim());

          const row: Record<string, string> = {};
          for (let j = 0; j < headers.length; j++) {
            const mapped = fieldMap[headers[j]];
            if (mapped && values[j]) row[mapped] = values[j];
          }
          if (row.name) rows.push(row);
        }

        const count = await bulkInsertContacts(rows as any);
        await logAudit("contact_updated", ctx.user.email!, ctx.user.name ?? null, "import", undefined, `Imported ${count} contacts via CSV`);
        return { imported: count };
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
        try {
          await notifyOwner({
            title: "New Access Request",
            content: `${ctx.user.name ?? email} (${email}) has requested access.\n\nReason: ${input.reason || "No reason provided"}`,
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
        noteType: z.enum(["meeting", "call", "email", "follow_up", "general", "research"]),
        content: z.string().min(1).max(10000),
      }))
      .mutation(async ({ ctx, input }) => {
        const note = await addMeetingNote(
          input.contactId, ctx.user.email!, ctx.user.name ?? null,
          input.noteType, input.content,
        );
        // Auto-update lastContactedAt when a note is added
        await setContactLastContacted(input.contactId);
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
    stats: adminProcedure.query(async () => getAdminStats()),

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

    requests: router({
      list: adminProcedure.query(async () => getAllAccessRequests()),
      pending: adminProcedure.query(async () => getPendingAccessRequests()),
      approve: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const requests = await getAllAccessRequests();
          const req = requests.find(r => r.id === input.id);
          if (!req) throw new Error("Request not found");
          await updateAccessRequestStatus(input.id, "approved", ctx.user.email!);
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

    invite: adminProcedure
      .input(z.object({ email: z.string().email(), message: z.string().max(500).optional() }))
      .mutation(async ({ ctx, input }) => {
        // Add to whitelist
        await addToWhitelist(input.email, ctx.user.email!);
        await logAudit("invite_sent", ctx.user.email!, ctx.user.name ?? null, "whitelist", undefined, input.email);
        // Notify owner about the invite
        try {
          await notifyOwner({
            title: "Platform Invite Sent",
            content: `${ctx.user.name ?? ctx.user.email} invited ${input.email} to the platform.\n\n${input.message ? `Message: ${input.message}` : ""}`,
          });
        } catch (_) { /* non-critical */ }
        return { success: true };
      }),

    auditLog: router({
      list: adminProcedure
        .input(z.object({
          action: z.enum([
            "profile_view", "note_added", "note_deleted",
            "access_approved", "access_denied",
            "whitelist_added", "whitelist_removed",
            "contact_updated", "contact_researched", "invite_sent",
          ]).optional(),
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(100).default(25),
        }))
        .query(async ({ input }) => {
          const offset = (input.page - 1) * input.pageSize;
          return getAuditLog({ action: input.action as any, limit: input.pageSize, offset });
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
