import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Handshake,
  ListTodo,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const NOTE_TYPES = [
  { value: "meeting" as const, label: "Meeting Note", icon: MessageSquare, color: "text-blue-400" },
  { value: "interaction" as const, label: "Interaction", icon: Handshake, color: "text-green-400" },
  { value: "follow_up" as const, label: "Follow-Up Task", icon: ListTodo, color: "text-amber-400" },
  { value: "general" as const, label: "General Note", icon: FileText, color: "text-muted-foreground" },
];

function getNoteTypeConfig(type: string) {
  return NOTE_TYPES.find((t) => t.value === type) ?? NOTE_TYPES[3];
}

interface ContactNotesProps {
  contactId: number;
  contactName: string;
}

export default function ContactNotes({ contactId, contactName }: ContactNotesProps) {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [noteType, setNoteType] = useState<"meeting" | "interaction" | "follow_up" | "general">("meeting");
  const [content, setContent] = useState("");
  const [showAll, setShowAll] = useState(false);

  const utils = trpc.useUtils();

  const { data: notes, isLoading } = trpc.notes.list.useQuery(
    { contactId },
    { refetchOnWindowFocus: false }
  );

  const createMutation = trpc.notes.create.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate({ contactId });
      setContent("");
      setIsFormOpen(false);
    },
  });

  const deleteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate({ contactId });
    },
  });

  const displayedNotes = useMemo(() => {
    if (!notes) return [];
    return showAll ? notes : notes.slice(0, 5);
  }, [notes, showAll]);

  const handleSubmit = () => {
    if (!content.trim()) return;
    createMutation.mutate({
      contactId,
      contactName,
      noteType,
      content: content.trim(),
    });
  };

  return (
    <section className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-primary" />
          <h2 className="font-mono-label text-[0.7rem] text-primary">
            RELATIONSHIP NOTES
          </h2>
          {notes && notes.length > 0 && (
            <span className="text-[0.6rem] font-mono-label text-muted-foreground bg-accent px-1.5 py-0.5 rounded">
              {notes.length}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          <Plus size={12} />
          Add Note
        </Button>
      </div>

      {/* Add note form */}
      {isFormOpen && (
        <div className="mb-4 border border-border rounded-lg p-4 bg-accent/30">
          {/* Note type selector */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {NOTE_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setNoteType(type.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                    noteType === type.value
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-accent"
                  }`}
                >
                  <Icon size={11} />
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* Content textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              noteType === "meeting"
                ? "Describe the meeting — key topics, decisions, next steps..."
                : noteType === "interaction"
                  ? "Describe the interaction — context, outcome, impressions..."
                  : noteType === "follow_up"
                    ? "What needs to be done? By when? Any dependencies?"
                    : "Add any relevant notes about this contact..."
            }
            rows={4}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
          />

          <div className="flex items-center justify-between mt-3">
            <p className="text-[0.6rem] text-muted-foreground">
              Logged by {user?.name ?? "you"} · {new Date().toLocaleDateString()}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsFormOpen(false);
                  setContent("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || createMutation.isPending}
                className="gap-1"
              >
                {createMutation.isPending ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>

          {createMutation.error && (
            <p className="text-xs text-red-400 mt-2">
              {createMutation.error.message}
            </p>
          )}
        </div>
      )}

      {/* Notes list */}
      {isLoading ? (
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground">Loading notes...</p>
        </div>
      ) : displayedNotes.length > 0 ? (
        <div className="space-y-3">
          {displayedNotes.map((note) => {
            const typeConfig = getNoteTypeConfig(note.noteType);
            const Icon = typeConfig.icon;
            const canDelete =
              note.userId === user?.id || user?.role === "admin";

            return (
              <div
                key={note.id}
                className="border border-border/50 rounded-lg p-3 hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className={`mt-0.5 ${typeConfig.color}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[0.6rem] font-mono-label ${typeConfig.color}`}
                        >
                          {typeConfig.label.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[0.6rem] text-muted-foreground">
                          <User size={9} />
                          {note.userName}
                        </span>
                        <span className="flex items-center gap-1 text-[0.6rem] text-muted-foreground">
                          <Clock size={9} />
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-red-400 h-7 w-7 p-0 flex-shrink-0"
                      onClick={() => deleteMutation.mutate({ id: note.id })}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={12} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Show more/less toggle */}
          {notes && notes.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mx-auto"
            >
              {showAll ? (
                <>
                  <ChevronUp size={12} />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown size={12} />
                  Show all {notes.length} notes
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <MessageSquare
            size={20}
            className="text-muted-foreground/30 mx-auto mb-2"
          />
          <p className="text-xs text-muted-foreground">
            No notes yet. Add a meeting note, interaction log, or follow-up task.
          </p>
        </div>
      )}
    </section>
  );
}
