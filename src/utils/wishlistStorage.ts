const WISHLIST_STORAGE_KEY = 'tkn_pinned_wishlist';

/**
 * Loads persisted pinned wishlist/stash product IDs from localStorage.
 */
export function loadWishlistIds(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id) => typeof id === 'string');
    }
    return [];
  } catch (err) {
    console.warn('Failed to parse wishlist from localStorage:', err);
    return [];
  }
}

/**
 * Persists pinned wishlist/stash product IDs to localStorage.
 */
export function saveWishlistIds(ids: string[]): void {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.warn('Failed to save wishlist to localStorage:', err);
  }
}
