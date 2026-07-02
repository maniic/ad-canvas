import { useState } from "react";
import type { AdSpec } from "../../shared/types";
import Canvas from "./Canvas";
import { SAMPLE_SPEC } from "./sample";
import styles from "./App.module.css";

export default function App() {
  const [spec] = useState<AdSpec | null>(SAMPLE_SPEC);

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
          <Canvas spec={spec} />
        ) : (
          <div className={styles.emptyState}>
            <p>Describe an ad to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}
