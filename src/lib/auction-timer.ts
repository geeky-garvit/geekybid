// src/lib/auction-timer.ts

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
  totalRemainingMs: number;
}

/**
 * Calculates time remaining against server time (or fixed UTC).
 * Prevents client-side time manipulation.
 */
export function calculateTimeRemaining(endTimeISO: string, currentServerTimeMs: number = Date.now()): TimeLeft {
  const endMs = new Date(endTimeISO).getTime();
  const totalRemainingMs = endMs - currentServerTimeMs;

  if (totalRemainingMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isEnded: true,
      totalRemainingMs: 0,
    };
  }

  const seconds = Math.floor((totalRemainingMs / 1000) % 60);
  const minutes = Math.floor((totalRemainingMs / 1000 / 60) % 60);
  const hours = Math.floor((totalRemainingMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalRemainingMs / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    isEnded: false,
    totalRemainingMs,
  };
}