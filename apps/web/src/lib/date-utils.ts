/**
 * Utility functions for date formatting and manipulation.
 */

/**
 * Format a date as a relative time string (e.g., "2 hrs ago", "3 days ago").
 *
 * The function returns human-readable relative time strings:
 * - Less than 60 seconds: "just now"
 * - Less than 60 minutes: "X min(s) ago"
 * - Less than 24 hours: "X hr(s) ago"
 * - Less than 30 days: "X day(s) ago"
 * - 30 days or more: Falls back to locale date string
 *
 * @param date - The date to format (ISO string or Date object)
 * @returns A human-readable relative time string
 */
export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();

  // Handle future dates or invalid dates
  if (diffMs < 0 || isNaN(diffMs)) {
    return then.toLocaleDateString();
  }

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  }

  if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  }

  if (diffDays < 30) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  return then.toLocaleDateString();
}

/**
 * Format a date as a short date string (e.g., "Jan 15, 2024").
 *
 * @param date - The date to format (ISO string or Date object)
 * @returns A formatted date string
 */
export function formatShortDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date as a date and time string (e.g., "Jan 15, 2024, 3:30 PM").
 *
 * @param date - The date to format (ISO string or Date object)
 * @returns A formatted date and time string
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
