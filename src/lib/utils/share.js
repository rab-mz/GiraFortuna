/**
 * Share text via Web Share API, falling back to clipboard copy.
 * @param {string} text
 * @returns {Promise<'shared'|'copied'|'cancelled'>}
 */
export async function shareOrCopy(text) {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
    }
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
