import { useRef, useEffect, useState } from "react";
import type { AdSpec, AdElement } from "../../shared/types";
import AdElementComponent from "./AdElement";
import styles from "./Canvas.module.css";

type Props = {
  spec: AdSpec;
  onUpdateElement: (id: string, patch: Partial<AdElement>) => void;
};

const LOGICAL_SIZE = 1080;

export default function Canvas({ spec, onUpdateElement }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const available = Math.min(width, height);
      setScale(available / LOGICAL_SIZE);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const { color, accentColor } = spec.background;

  function handleCanvasPointerDown() {
    setSelectedId(null);
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <div
        className={styles.scaler}
        style={{
          width: LOGICAL_SIZE,
          height: LOGICAL_SIZE,
          transform: `scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        {/* Background */}
        <div
          className={styles.canvas}
          style={{ backgroundColor: color }}
          onPointerDown={handleCanvasPointerDown}
        >
          {/* Accent shape */}
          <div
            className={styles.accent}
            style={{
              background: `radial-gradient(ellipse at 110% -10%, ${accentColor}33 0%, transparent 60%)`,
            }}
          />

          {/* Ad elements */}
          {spec.elements.map((el) => (
            <AdElementComponent
              key={el.id}
              element={el}
              scale={scale}
              selected={selectedId === el.id}
              onSelect={setSelectedId}
              onUpdate={onUpdateElement}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
