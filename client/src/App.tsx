import { useState, useCallback, useRef, useEffect } from "react";
import type { AdSpec, AdElement } from "../../shared/types";
import Canvas from "./Canvas";
import Chat from "./Chat";
import type { ChatMessage } from "./Chat";
import { generateAd } from "./api";
import styles from "./App.module.css";

export default function App() {
  const [spec, setSpec] = useState<AdSpec | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Keep a ref so sendMessage always sees the latest spec without needing
  // it in its dependency array (avoids re-creating the callback on every edit).
  const specRef = useRef<AdSpec | null>(null);
  useEffect(() => {
    specRef.current = spec;
  }, [spec]);

  const updateElement = useCallback(
    (id: string, patch: Partial<AdElement>) => {
      setSpec((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          elements: prev.elements.map((el) =>
            el.id === id ? { ...el, ...patch } : el
          ),
        };
      });
    },
    []
  );

  const sendMessage = useCallback(async (text: string) => {
    const currentSpec = specRef.current;
    setHistory((prev) => [...prev, { role: "user", text }]);
    setIsLoading(true);

    try {
      const result = await generateAd({ message: text, currentSpec });
      setSpec(result.spec);
      setHistory((prev) => [
        ...prev,
        { role: "assistant", text: result.assistantMessage },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setHistory((prev) => [...prev, { role: "error", text: message }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className={styles.app}>
      {/* Left sidebar — Chat */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logo}>Ad Canvas</span>
        </div>
        <div className={styles.sidebarBody}>
          <Chat
            history={history}
            isLoading={isLoading}
            onSend={sendMessage}
          />
        </div>
      </aside>

      {/* Right canvas area */}
      <main className={styles.main}>
        {spec ? (
          <Canvas spec={spec} onUpdateElement={updateElement} />
        ) : (
          <div className={styles.emptyState}>
            <p>Describe an ad to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}
