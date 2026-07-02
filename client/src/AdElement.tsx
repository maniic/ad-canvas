import { useRef, useEffect, useState } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { AdElement as AdElementType } from "../../shared/types";
import styles from "./AdElement.module.css";

type Props = {
  element: AdElementType;
  scale: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<AdElementType>) => void;
};

export default function AdElement({
  element,
  scale,
  selected,
  onSelect,
  onUpdate,
}: Props) {
  const { id, x, y, text, fontSize, color, fontWeight, bgColor, padding } =
    element;

  const divRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  // Captures the text value when entering edit mode so Escape can restore it
  const editInitRef = useRef<string>("");

  const dragRef = useRef<{
    startX: number;
    startY: number;
    elStartX: number;
    elStartY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (editing && divRef.current) {
      const el = divRef.current;
      el.innerText = editInitRef.current;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (editing) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elStartX: x,
      elStartY: y,
      moved: false,
    };
    onSelect(id);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current || editing) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (!dragRef.current.moved && Math.abs(dx) + Math.abs(dy) > 4) {
      dragRef.current.moved = true;
    }
    if (dragRef.current.moved) {
      const newX = Math.round(dragRef.current.elStartX + dx / scale);
      const newY = Math.round(dragRef.current.elStartY + dy / scale);
      onUpdate(id, { x: newX, y: newY });
    }
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }

  function handleClick(e: ReactMouseEvent<HTMLDivElement>) {
    e.stopPropagation();
  }

  function handleDoubleClick(e: ReactMouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    editInitRef.current = text;
    setEditing(true);
  }

  function commitEdit() {
    const newText = divRef.current?.innerText ?? editInitRef.current;
    if (newText !== editInitRef.current) {
      onUpdate(id, { text: newText });
    }
    setEditing(false);
  }

  function handleBlur() {
    commitEdit();
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      if (divRef.current) {
        divRef.current.innerText = editInitRef.current;
      }
      setEditing(false);
    }
  }

  const isCta = Boolean(bgColor);

  const className = [
    isCta ? styles.cta : styles.element,
    selected ? styles.selected : undefined,
    editing ? styles.editing : undefined,
  ]
    .filter((c): c is string => Boolean(c))
    .join(" ");

  return (
    <div
      ref={divRef}
      className={className}
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontSize,
        color,
        fontWeight: fontWeight ?? "normal",
        cursor: editing ? "text" : "grab",
        userSelect: editing ? "text" : "none",
        ...(bgColor !== undefined
          ? {
              backgroundColor: bgColor,
              padding: padding ?? 16,
              borderRadius: 8,
            }
          : {}),
      }}
      contentEditable={editing}
      suppressContentEditableWarning
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onBlur={editing ? handleBlur : undefined}
      onKeyDown={editing ? handleKeyDown : undefined}
    >
      {editing ? null : text}
    </div>
  );
}
