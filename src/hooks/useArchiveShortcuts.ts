import { useEffect, useCallback } from 'react';

export interface ShortcutDefinition {
  key: string;
  description: string;
  category: 'Navigation' | 'Actions' | 'Modals';
}

export const ARCHIVE_SHORTCUTS: ShortcutDefinition[] = [
  { key: 'B', description: 'Open / toggle Shopping Bag & checkout slip', category: 'Actions' },
  { key: 'W', description: 'Open / toggle Pinned Wishlist stash', category: 'Actions' },
  { key: 'G', description: 'Open 300-500GSM garment size guide & schematic', category: 'Modals' },
  { key: 'S or /', description: 'Quick-focus archive garment search', category: 'Actions' },
  { key: 'Esc', description: 'Close any active modal or blur search', category: 'Modals' },
  { key: 'T', description: 'Open live Royal Mail order tracking', category: 'Navigation' },
  { key: 'A', description: 'Open London Studio Admin Console', category: 'Navigation' },
  { key: '?', description: 'Toggle keyboard shortcuts cheat sheet', category: 'Actions' },
  { key: '1 - 6', description: 'Jump between garment categories', category: 'Navigation' },
];

export interface UseArchiveShortcutsOptions {
  onToggleBag?: () => void;
  onToggleWishlist?: () => void;
  onToggleSizeGuide?: () => void;
  onFocusSearch?: () => void;
  onCloseModals?: () => void;
  onOpenTracker?: () => void;
  onOpenAdmin?: () => void;
  onToggleShortcutsModal?: () => void;
  onSelectCategoryIndex?: (index: number) => void;
  isAnyModalOpen?: boolean;
  enabled?: boolean;
}

/**
 * Custom hook detecting global keyboard shortcuts for the TO KNOW NOTHING archive.
 * Power-user accessible:
 * - 'B' to open/toggle the Bag
 * - 'S' or '/' to focus the search input
 * - 'Esc' to close any active modal or blur input
 * - 'T' to open Order Tracker
 * - 'A' to open Admin Console
 * - '?' to display Keyboard Shortcuts modal
 * - '1'-'6' to navigate categories
 * 
 * Safely ignores single-key shortcuts when user is focused inside an <input>, <textarea>, or contentEditable.
 */
export function useArchiveShortcuts({
  onToggleBag,
  onToggleWishlist,
  onToggleSizeGuide,
  onFocusSearch,
  onCloseModals,
  onOpenTracker,
  onOpenAdmin,
  onToggleShortcutsModal,
  onSelectCategoryIndex,
  isAnyModalOpen = false,
  enabled = true,
}: UseArchiveShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || event.defaultPrevented) return;

      const target = event.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox');

      // 'Escape' works everywhere (even when focused in an input)
      if (event.key === 'Escape') {
        if (isInput) {
          target.blur();
        }
        if (onCloseModals) {
          onCloseModals();
        }
        return;
      }

      // Do not trigger single-key letter shortcuts if the user is typing in a form or input
      if (isInput) {
        // Allow Cmd+K or Ctrl+K even inside inputs
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          onFocusSearch?.();
        }
        return;
      }

      // Ignore if Cmd, Ctrl, or Alt is pressed (except standard Shift for '?')
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = event.key;

      switch (key.toLowerCase()) {
        case 'b': {
          event.preventDefault();
          onToggleBag?.();
          break;
        }

        case 'w': {
          event.preventDefault();
          onToggleWishlist?.();
          break;
        }

        case 'g': {
          event.preventDefault();
          onToggleSizeGuide?.();
          break;
        }

        case 's':
        case '/': {
          event.preventDefault();
          onFocusSearch?.();
          break;
        }

        case 't': {
          event.preventDefault();
          onOpenTracker?.();
          break;
        }

        case 'a': {
          event.preventDefault();
          onOpenAdmin?.();
          break;
        }

        case '?': {
          event.preventDefault();
          onToggleShortcutsModal?.();
          break;
        }

        // Category direct jump: 1 to 6
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6': {
          const catIdx = parseInt(key, 10) - 1;
          event.preventDefault();
          onSelectCategoryIndex?.(catIdx);
          break;
        }

        default:
          break;
      }
    },
    [
      enabled,
      onToggleBag,
      onFocusSearch,
      onCloseModals,
      onOpenTracker,
      onOpenAdmin,
      onToggleShortcutsModal,
      onSelectCategoryIndex,
    ]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}
