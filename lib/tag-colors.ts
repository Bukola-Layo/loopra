const tagPalette = [
  { bg: "rgba(44, 173, 192, 0.15)", color: "#2cadc0", border: "rgba(44, 173, 192, 0.3)" },
  { bg: "rgba(236, 57, 82, 0.12)", color: "#ec3952", border: "rgba(236, 57, 82, 0.3)" },
  { bg: "rgba(31, 193, 107, 0.15)", color: "#1fc16b", border: "rgba(31, 193, 107, 0.3)" },
];

function hashStr(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function tagColorStyle(tag: string): React.CSSProperties {
  const idx = hashStr(tag) % tagPalette.length;
  const c = tagPalette[idx];
  return {
    backgroundColor: c.bg,
    color: c.color,
    borderColor: c.border,
  };
}
