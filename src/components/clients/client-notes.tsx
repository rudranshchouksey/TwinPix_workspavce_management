"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Loader2, Trash2, MessageSquarePlus } from "lucide-react";

import { addClientNoteAction, deleteClientNoteAction } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Textarea } from "../ui/textarea";

interface ClientNotesProps {
  clientId: string;
  notes: any[];
}

export function ClientNotes({ clientId, notes }: ClientNotesProps) {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    try {
      await addClientNoteAction({
        content: newNote.trim(),
        clientId,
      });
      setNewNote("");
      toast.success("Note added successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeletingId(noteId);
    try {
      await deleteClientNoteAction(noteId, clientId);
      toast.success("Note deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete note");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Note Area */}
      <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface-900)] p-4 glass-card">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-3">
          <MessageSquarePlus className="w-4 h-4 text-[var(--color-brand-400)]" />
          Add Note
        </h3>
        <Textarea
          placeholder="Type a new note here..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] min-h-[100px] mb-3 resize-none focus-visible:ring-[var(--color-brand-500)] text-sm"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleAddNote}
            disabled={!newNote.trim() || isSubmitting}
            className="bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] h-9 text-xs"
          >
            {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Save Note
          </Button>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
            No notes have been added yet.
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="relative rounded-xl border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)] p-4 group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-[var(--color-text-muted)]">
                  {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => handleDeleteNote(note.id)}
                  disabled={deletingId === note.id}
                >
                  {deletingId === note.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
