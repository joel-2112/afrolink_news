import { analyticsWorker } from './analytics.worker';
import { scheduleAnalyticsJob } from './analytics.scheduler';

export const initJobs = async () => {
  
  console.log('[Jobs] Analytics worker started');

  
  await scheduleAnalyticsJob();

  
  const shutdown = async (signal: string) => {
    console.log(`[Jobs] ${signal} received — shutting down workers`);
    await analyticsWorker.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};