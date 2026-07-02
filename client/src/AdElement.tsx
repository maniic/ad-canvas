import type { AdElement as AdElementType } from "../../shared/types";
import styles from "./AdElement.module.css";

type Props = {
  element: AdElementType;
};

export default function AdElement({ element }: Props) {
  const { x, y, text, fontSize, color, fontWeight, bgColor, padding } = element;

  return (
    <div
      className={bgColor ? styles.cta : styles.element}
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontSize,
        color,
        fontWeight: fontWeight ?? "normal",
        ...(bgColor
          ? {
              backgroundColor: bgColor,
              padding: padding ?? 16,
              borderRadius: 8,
            }
          : {}),
      }}
    >
      {text}
    </div>
  );
}
