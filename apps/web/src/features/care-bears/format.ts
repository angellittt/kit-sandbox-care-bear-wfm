import { localeTag } from "@/lib/locale";

const dateFormat = new Intl.DateTimeFormat(localeTag, {
  month: "short",
  day: "numeric",
});

const yearFormat = new Intl.DateTimeFormat(localeTag, {
  month: "long",
  year: "numeric",
});

const numberFormat = new Intl.NumberFormat(localeTag);

// Mock dates are calendar dates; parse them as local midnight, not UTC.
const parse = (iso: string) => new Date(`${iso}T00:00:00`);

export const formatDate = (iso: string) => dateFormat.format(parse(iso));

export const formatMonthYear = (iso: string) => yearFormat.format(parse(iso));

export const formatRange = (start: string, end: string) =>
  start === end
    ? formatDate(start)
    : `${formatDate(start)} – ${formatDate(end)}`;

export const formatNumber = (value: number) => numberFormat.format(value);
