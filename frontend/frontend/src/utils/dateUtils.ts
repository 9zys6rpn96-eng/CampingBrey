/**
 * Utility functions for date handling
 * Shared across components to avoid duplication
 */

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getStayLength(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diffMs = end.getTime() - start.getTime();
  const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (nights <= 0) return "0 Nächte";
  return nights === 1 ? "1 Nacht" : `${nights} Nächte`;
}

export function getNextWeekendRange() {
  const today = new Date();
  const day = today.getDay();

  const daysUntilFriday = day <= 5 ? 5 - day : 6;
  const friday = addDays(today, daysUntilFriday);
  const sunday = addDays(friday, 2);

  return {
    start: toIsoDate(friday),
    end: toIsoDate(sunday),
  };
}

export function getNextWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;

  const monday = addDays(today, daysUntilNextMonday);
  const nextMonday = addDays(monday, 7);

  return {
    start: toIsoDate(monday),
    end: toIsoDate(nextMonday),
  };
}

export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

