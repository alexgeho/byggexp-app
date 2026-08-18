// Initials for an avatar fallback: first + last word's first letter, uppercased
// (e.g. "John Michael Doe" -> "JD"). Falls back to "?" for an empty name.
// Shared by the Avatar component and the chat header avatar.
export const getInitials = (name) => {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};
