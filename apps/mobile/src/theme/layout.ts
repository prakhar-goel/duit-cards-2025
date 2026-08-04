/**
 * Shared layout constraints for large phones and tablets.
 *
 * The app is phone-first, but centered max widths prevent content from becoming
 * unreadably wide on tablets while we wait for true multi-column tablet layouts.
 */
export const layout = {
  contentMaxWidth: 720,
  detailMaxWidth: 760,
} as const;
