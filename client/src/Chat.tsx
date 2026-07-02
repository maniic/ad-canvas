import { useRef, useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import styles from "./Chat.module.css";

export type ChatMessage = {
  role: "user" | "assistant" | "error";
  text: string;
};

type Props = {
  history: ChatMessage[];
  isLoading: boolean;
  onSend: (text: string) => void;
};

export default function Chat({ history, isLoading, onSend }: Props) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever history changes
  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [history]);

  function handleSend() {
    const text = draft.trim();
    if (!text || isLoading) return;
    setDraft("");
    onSend(text);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={styles.chat}>
      <div ref={listRef} className={styles.messageList}>
        {history.length === 0 && (
          <p className={styles.emptyHint}>Describe an ad to get started.</p>
        )}
        {history.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === "user"
                ? styles.userBubble
                : msg.role === "error"
                ? styles.errorBubble
                : styles.assistantBubble
            }
          >
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className={styles.loadingRow}>
            <span className={styles.spinner} aria-label="Loading" />
            <span className={styles.loadingText}>Generating…</span>
          </div>
        )}
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.input}
          type="text"
          placeholder="Describe your ad…"
          value={draft}
          disabled={isLoading}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={isLoading || !draft.trim()}
          aria-label="Send"
        >
          Send
        </button>
      </div>
    </div>
  );
}
