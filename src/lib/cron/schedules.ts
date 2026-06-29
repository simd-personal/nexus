/** Cron schedules from vercel.json — keep in sync when adding cron jobs. */
export const VERCEL_CRON_SCHEDULES = ['*/5 * * * *', '0 4 * * *'] as const;

export function isKnownVercelCronSchedule(schedule: string | null): boolean {
  if (!schedule) return false;
  return (VERCEL_CRON_SCHEDULES as readonly string[]).includes(schedule);
}
