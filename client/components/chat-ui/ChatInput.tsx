import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Paperclip,
  Mic,
  Search,
  Smile,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  onSend: () => Promise<void>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRecordToggle: () => void;
  recording: boolean;
  loading: boolean;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  emojiMap: Record<string, string>;
  onInsertEmoji: (emoji: string) => void;
  onExportHistory: () => void;
  onImportHistory: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ChatInput({
  input,
  setInput,
  onSend,
  onFileChange,
  onRecordToggle,
  recording,
  loading,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiMap,
  onInsertEmoji,
  onExportHistory,
  onImportHistory,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const triggerImportInput = () => importInputRef.current?.click();

  const handleWebSearch = () => {
    if (!input.trim()) return;
    window.open("https://www.google.com/search?q=" + encodeURIComponent(input.trim()), "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 bg-gradient-to-t from-card to-transparent p-4 rounded-lg border border-border/50"
    >
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg border bg-card grid grid-cols-6 gap-2"
        >
          {Object.values(emojiMap).map((emoji, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onInsertEmoji(emoji)}
              className="p-2 rounded-lg hover:bg-accent text-xl transition-colors"
              title={`emoji-${i}`}
            >
              {emoji}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Left Controls */}
        <div className="flex gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="h-10 w-10 rounded-lg border border-border/50 flex items-center justify-center hover:bg-accent transition-all"
            title="Emoji picker"
          >
            <Smile className="h-5 w-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRecordToggle}
            className={`h-10 w-10 rounded-lg border border-border/50 flex items-center justify-center transition-all ${
              recording ? "bg-destructive/20 border-destructive/50" : "hover:bg-accent"
            }`}
            title="Microphone"
          >
            {recording ? <Mic className="h-5 w-5 text-destructive animate-pulse" /> : <Mic className="h-5 w-5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={triggerFileInput}
            className="h-10 w-10 rounded-lg border border-border/50 flex items-center justify-center hover:bg-accent transition-all"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </motion.button>

          <input
            ref={fileInputRef}
            type="file"
            onChange={onFileChange}
            className="hidden"
            title="File input"
          />
        </div>

        {/* Text Input */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écris ton message... (Shift+Entrée pour nouvelle ligne)"
          className="flex-1 min-h-11 max-h-32 rounded-lg border border-border/50 bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
        />

        {/* Right Controls */}
        <div className="flex flex-col gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="h-10 w-10 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground flex items-center justify-center hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWebSearch}
            disabled={!input.trim()}
            className="h-10 w-10 rounded-lg border border-border/50 flex items-center justify-center hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Web search"
          >
            <Search className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onExportHistory}
          className="text-xs px-3 py-1.5 rounded-lg border border-border/50 hover:bg-accent transition-all"
        >
          Exporter
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={triggerImportInput}
          className="text-xs px-3 py-1.5 rounded-lg border border-border/50 hover:bg-accent transition-all flex items-center gap-1"
        >
          <Upload className="h-3 w-3" />
          Importer
        </motion.button>

        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          onChange={onImportHistory}
          className="hidden"
        />
      </div>
    </motion.div>
  );
}
