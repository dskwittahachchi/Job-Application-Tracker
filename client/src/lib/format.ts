import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

const parseDate = (value?: string) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};
export const formatDate = (value?: string, pattern = "MMM d, yyyy") => {
  const date = parseDate(value);
  return date ? format(date, pattern) : "Not set";
};
export const formatRelativeDate = (value?: string) => {
  const date = parseDate(value);
  return date ? formatDistanceToNowStrict(date, { addSuffix: true }) : "No date";
};
export const formatCurrencyRange = (minimum?: number, maximum?: number) => {
  if (minimum === undefined && maximum === undefined) return "Not specified";
  const compact = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, notation: "compact" });
  if (minimum !== undefined && maximum !== undefined) return `${compact.format(minimum)} - ${compact.format(maximum)}`;
  return minimum !== undefined ? `From ${compact.format(minimum)}` : `Up to ${compact.format(maximum!)}`;
};
export const toDateTimeLocal = (value?: string) => (value ? value.slice(0, 16) : "");
export const toIsoOrUndefined = (value: string) => (value ? new Date(value).toISOString() : undefined);
