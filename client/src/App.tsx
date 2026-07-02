import { useState, useCallback } from "react";
import type { AdSpec, AdElement } from "../../shared/types";
import Canvas from "./Canvas";
import { SAMPLE_SPEC } from "./sample";
import styles from "./App.module.css";

export default function App() {
  const [spec, setSpec] = useState<AdSpec | null>(SAMPLE_SPEC);

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

  return (
    <div className={styles.app}>
      {/* Left sidebar — placeholder for Task 4 Chat */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logo}>Ad Canvas</span>
        </div>
        <div className={styles.sidebarBody}>
          <p className={styles.emptyHint}>Describe an ad to get started.</p>
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
