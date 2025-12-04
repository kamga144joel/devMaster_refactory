import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { Copy, Download, RotateCcw, ThumbsDown, ThumbsUp, Edit2, Trash2 } from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string | any;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
  renderMarkdown: (body: string | any) => React.ReactNode;
  onCopy: (text: string) => void;
  onDownload: (message: ChatMessage) => void;
  onRegenerate: (messageId: string) => void;
  onFeedback: (messageId: string, positive: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  editingText: string;
  onSaveEdit: (id: string) => Promise<void>;
  onCancelEdit: () => void;
  onEditingTextChange: (text: string) => void;
  conversations: any[];
  onRestoreConversation: (id: string) => void;
  onRemoveConversation: (id: string) => void;
}

export default function ChatMessages({
  messages,
  loading,
  renderMarkdown,
  onCopy,
  onDownload,
  onRegenerate,
  onFeedback,
  onEdit,
  onDelete,
  editingId,
  editingText,
  onSaveEdit,
  onCancelEdit,
  onEditingTextChange,
  conversations,
  onRestoreConversation,
  onRemoveConversation,
}: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <motion.div className="space-y-4 min-h-[50vh]">
      {/* Conversations History */}
      {conversations && conversations.length > 0 && (
        <details className="mb-4">
          <summary className="cursor-pointer text-sm font-semibold hover:text-primary transition-colors">
            📚 Historique ({conversations.length} conversations)
          </summary>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 max-h-48 overflow-y-auto"
          >
            {conversations.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border/50 bg-accent/30 hover:bg-accent/50 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(c.ts).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onRestoreConversation(c.id)}
                    className="text-xs px-2 py-1 rounded-md border border-border/50 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    Ouvrir
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onRemoveConversation(c.id)}
                    className="text-xs px-2 py-1 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all"
                  >
                    ×
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </details>
      )}

      {/* Empty State */}
      {messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="text-5xl mb-4">💬</div>
          <p className="text-muted-foreground max-w-sm">
            Posez n'importe quelle question : actualités, idées, rédaction, recherche, code...
          </p>
        </motion.div>
      )}

      {/* Messages */}
      <AnimatePresence mode="popLayout">
        {messages.map((m) => {
          const isAssistant = m.role === "assistant";
          let body: any = m.content;

          if (isAssistant && typeof m.content === "string") {
            if (m.content.startsWith("__IMAGES__")) {
              try {
                body = JSON.parse(m.content.slice(10));
              } catch {
                body = { images: [] };
              }
            } else if (m.content.startsWith("__FILE__")) {
              try {
                body = JSON.parse(m.content.slice(8));
              } catch {
                body = null;
              }
            }
          }

          return (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-lg border p-4 ${
                isAssistant
                  ? "border-border/50 bg-card/50"
                  : "border-primary/30 bg-primary/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    {isAssistant ? "🤖 Assistant" : "👤 Vous"}
                  </p>

                  {editingId === m.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => onEditingTextChange(e.target.value)}
                        className="w-full h-24 p-2 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSaveEdit(m.id)}
                          className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                        >
                          Réenvoyer
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={onCancelEdit}
                          className="h-8 px-4 rounded-lg border text-sm font-medium"
                        >
                          Annuler
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {renderMarkdown(body)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!editingId && (
                  <div className="flex flex-col gap-1.5 ml-2">
                    {isAssistant ? (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            onCopy(
                              typeof m.content === "string"
                                ? m.content
                                : JSON.stringify(m.content)
                            )
                          }
                          className="h-8 w-8 rounded-lg border border-border/50 flex items-center justify-center hover:bg-accent transition-all"
                          title="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onDownload(m)}
                          className="h-8 w-8 rounded-lg border border-border/50 flex items-center justify-center hover:bg-accent transition-all"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onRegenerate(m.id)}
                          className="h-8 w-8 rounded-lg border border-border/50 flex items-center justify-center hover:bg-accent transition-all"
                          title="Regenerate"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </motion.button>
                        <div className="flex gap-1 border-t pt-1">
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onFeedback(m.id, true)}
                            className="text-lg"
                            title="Good"
                          >
                            👍
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onFeedback(m.id, false)}
                            className="text-lg"
                            title="Bad"
                          >
                            👎
                          </motion.button>
                        </div>
                      </>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onEdit(m.id)}
                          className="h-8 w-8 rounded-lg border border-border/50 flex items-center justify-center hover:bg-accent transition-all"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onDelete(m.id)}
                          className="h-8 w-8 rounded-lg border border-destructive/30 flex items-center justify-center hover:bg-destructive/10 text-destructive transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Loading Indicator */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary"
          />
          L'assistant écrit...
        </motion.div>
      )}

      {/* Scroll Anchor */}
      <div ref={endRef} />
    </motion.div>
  );
}
