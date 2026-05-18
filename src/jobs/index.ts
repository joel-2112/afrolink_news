import { analyticsWorker } from './analytics.worker';
import { scheduleAnalyticsJob } from './analytics.scheduler';

export const initJobs = async () => {
  // start the worker
  console.log('[Jobs] Analytics worker started');

  // schedule the daily cron
  await scheduleAnalyticsJob();

  // graceful shutdown — let jobs finish before process exits
  const shutdown = async (signal: string) => {
    console.log(`[Jobs] ${signal} received — shutting down workers`);
    await analyticsWorker.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};