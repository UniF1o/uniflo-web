// DateInput — three-select day/month/year picker.
//
// Replaces <input type="date"> which renders inconsistently across browsers
// and has poor UX on Android (spinner wheels) and iOS (drum-roll picker).
// Three native <select> elements give consistent cross-platform behaviour,
// open the platform's own picker, and work with autofill on supported browsers.
//
// Value contract: receives and emits YYYY-MM-DD strings (same as input[type=date]),
// or "" when the selection is incomplete. Parents treat it identically to a
// text input carrying an ISO date string.
//
// Day options are re-calculated when month or year changes — selecting February
// then trying to pick day 31 is impossible because the option doesn't exist, and
// an already-selected day that exceeds the new month's length is cleared.
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Returns the number of days in a given month+year combination.
// month is 1-indexed ("01"–"12"). Falls back to 31 when either is missing.
function getDaysInMonth(month: string, year: string): number {
  if (!month) return 31;
  const m = parseInt(month, 10);
  const y = year ? parseInt(year, 10) : 2000;
  // new Date(y, m, 0) = day 0 of month m (0-indexed) = last day of month m-1.
  // Since our month is 1-indexed, this gives the last day of that month.
  return new Date(y, m, 0).getDate();
}

interface DateInputProps {
  id: string;
  label: string;
  value: string; // YYYY-MM-DD or ""
  onChange: (value: string) => void;
  error?: string;
  minYear?: number;
  maxYear?: number;
}

export function DateInput({
  id,
  label,
  value,
  onChange,
  error,
  minYear = 1930,
  maxYear,
}: DateInputProps) {
  const currentYear = new Date().getFullYear();
  const effectiveMaxYear = maxYear ?? currentYear;

  const [day, setDay] = useState(() =>
    value ? (value.split("-")[2] ?? "") : "",
  );
  const [month, setMonth] = useState(() =>
    value ? (value.split("-")[1] ?? "") : "",
  );
  const [year, setYear] = useState(() =>
    value ? (value.split("-")[0] ?? "") : "",
  );

  // Track the last prop value we synced from. When `value` changes externally
  // (e.g. after an async API load populates the parent's state), update the
  // individual selects during render. This is the React-approved alternative
  // to setState-inside-effect: the condition becomes false after the first
  // update so there is no infinite render loop.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split("-");
      setYear(parts[0] ?? "");
      setMonth(parts[1] ?? "");
      setDay(parts[2] ?? "");
    } else {
      setYear("");
      setMonth("");
      setDay("");
    }
  }

  function emit(d: string, m: string, y: string) {
    if (d && m && y) {
      onChange(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    } else {
      onChange("");
    }
  }

  function handleDayChange(d: string) {
    setDay(d);
    emit(d, month, year);
  }

  function handleMonthChange(m: string) {
    // Clear day if it exceeds the new month's length (e.g. Jan 31 → Feb).
    const maxDay = getDaysInMonth(m, year);
    const newDay = parseInt(day, 10) > maxDay ? "" : day;
    setMonth(m);
    setDay(newDay);
    emit(newDay, m, year);
  }

  function handleYearChange(y: string) {
    // Clear day if Feb 29 becomes invalid when switching to a non-leap year.
    const maxDay = getDaysInMonth(month, y);
    const newDay = parseInt(day, 10) > maxDay ? "" : day;
    setYear(y);
    setDay(newDay);
    emit(newDay, month, y);
  }

  const maxDays = getDaysInMonth(month, year);
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);
  const years = Array.from(
    { length: effectiveMaxYear - minYear + 1 },
    (_, i) => effectiveMaxYear - i, // descending — most-recent years first
  );

  const selectClass = cn(
    "h-11 w-full cursor-pointer appearance-none rounded-lg border border-border bg-background px-3 pr-7 text-sm text-foreground",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_0_rgba(13,26,61,0.04)]",
    "transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25",
    error &&
      "border-destructive focus:border-destructive focus:ring-destructive/25",
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>

      {/* Three selects in a row: Day (narrow) | Month (flexible) | Year (medium).
       * role="group" + aria-label exposes the composite field as a single
       * labelled group to screen readers. */}
      <div
        role="group"
        aria-label={label}
        aria-describedby={error ? `${id}-error` : undefined}
        className="grid grid-cols-[72px_1fr_90px] gap-2"
      >
        {/* Day */}
        <div className="relative">
          <select
            id={`${id}-day`}
            aria-label="Day"
            value={day}
            onChange={(e) => handleDayChange(e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              DD
            </option>
            {days.map((d) => {
              const val = String(d).padStart(2, "0");
              return (
                <option key={d} value={val}>
                  {val}
                </option>
              );
            })}
          </select>
          <ChevronDown
            size={14}
            aria-hidden
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>

        {/* Month */}
        <div className="relative">
          <select
            id={`${id}-month`}
            aria-label="Month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              Month
            </option>
            {MONTHS.map((name, i) => (
              <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            aria-hidden
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>

        {/* Year */}
        <div className="relative">
          <select
            id={`${id}-year`}
            aria-label="Year"
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              YYYY
            </option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            aria-hidden
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </div>

      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
