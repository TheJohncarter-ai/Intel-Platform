// ============================================================
// DESIGN: Contact info update submission modal
// Allows whitelisted users to flag outdated info for admin review
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Pencil, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const UPDATABLE_FIELDS = [
  { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number" },
  { value: "cell", label: "Cell / Mobile" },
  { value: "linkedin", label: "LinkedIn URL" },
  { value: "role", label: "Job Title / Role" },
  { value: "organization", label: "Organization" },
  { value: "location", label: "Location" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other Information" },
] as const;

type FieldValue = (typeof UPDATABLE_FIELDS)[number]["value"];

interface ContactUpdateModalProps {
  contactId: number;
  contactName: string;
  open: boolean;
  onClose: () => void;
}

export default function ContactUpdateModal({
  contactId,
  contactName,
  open,
  onClose,
}: ContactUpdateModalProps) {
  const [field, setField] = useState<FieldValue>("email");
  const [newValue, setNewValue] = useState("");
  const [context, setContext] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.contactUpdate.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Update submitted for admin review");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit update");
    },
  });

  const handleSubmit = () => {
    if (!newValue.trim()) return;
    submitMutation.mutate({
      contactId,
      contactName,
      field,
      newValue: newValue.trim(),
      context: context.trim() || undefined,
    });
  };

  const handleClose = () => {
    setField("email");
    setNewValue("");
    setContext("");
    setSubmitted(false);
    onClose();
  };

  const selectedFieldLabel = UPDATABLE_FIELDS.find((f) => f.value === field)?.label ?? field;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
            <Pencil size={16} className="text-primary" />
            Submit Info Update
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Flag outdated information for <span className="text-foreground">{contactName}</span>.
            The admin will review and apply the update.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
              <Check size={20} className="text-green-500" />
            </div>
            <p className="font-display text-lg text-foreground mb-1">Update Submitted</p>
            <p className="text-sm text-muted-foreground">
              Your update for <span className="text-foreground">{selectedFieldLabel}</span> has been sent to the admin for review.
            </p>
            <Button onClick={handleClose} className="mt-4" variant="outline">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Field selector */}
            <div>
              <label className="font-mono-label text-[0.65rem] text-muted-foreground block mb-2">
                FIELD TO UPDATE
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {UPDATABLE_FIELDS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setField(f.value)}
                    className={`px-3 py-2 rounded-md text-xs text-left transition-colors ${
                      field === f.value
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-accent"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* New value */}
            <div>
              <label className="font-mono-label text-[0.65rem] text-muted-foreground block mb-1.5">
                NEW VALUE
              </label>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={`Enter updated ${selectedFieldLabel.toLowerCase()}...`}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Context / source */}
            <div>
              <label className="font-mono-label text-[0.65rem] text-muted-foreground block mb-1.5">
                SOURCE / CONTEXT <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Where did you find this? LinkedIn, business card, recent conversation..."
                rows={2}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
              />
            </div>

            {submitMutation.error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 rounded-md px-3 py-2">
                <AlertCircle size={12} />
                {submitMutation.error.message}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newValue.trim() || submitMutation.isPending}
                className="flex-1 gap-1"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Update"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
