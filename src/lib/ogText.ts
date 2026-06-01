// Pure text helpers shared by the server-side OG tag injection and tests.
// No DOM / Node APIs so this is safe to import anywhere and unit-test in isolation.

/** Escape a string for safe inclusion in an HTML attribute or text node. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Trim `s` to at most `max` characters at a word boundary, appending an
 * ellipsis when shortened. Keeps social-card titles from being sliced
 * mid-word by platform truncation (e.g. iMessage's 2-line cap).
 */
export function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const body = lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut;
  return body.replace(/[\s.,;:!?—-]+$/, '') + '…';
}
