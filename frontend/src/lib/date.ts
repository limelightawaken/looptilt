import {
  format,
  formatDistance,
  formatRelative,
  parseISO,
  isValid,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  addMonths,
  addYears,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
  isToday,
  isYesterday,
  isTomorrow,
} from "date-fns";

export {
  format,
  formatDistance,
  formatRelative,
  parseISO,
  isValid,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  addMonths,
  addYears,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
  isToday,
  isYesterday,
  isTomorrow,
};

export function formatDate(date: Date | string, formatStr: string = "PPP"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "Invalid date";
  return format(d, formatStr);
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "Invalid date";
  return formatDistance(d, new Date(), { addSuffix: true });
}

export function getDateRangeLabel(start: Date, end: Date): string {
  const days = differenceInDays(end, start);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7) return "Last 7 days";
  if (days <= 30) return "Last 30 days";
  if (days <= 90) return "Last 3 months";
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
}

