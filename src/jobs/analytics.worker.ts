import { Worker, Job } from 'bullmq';
import redis from '../config/redis';
import prisma from '../config/database';

interface AnalyticsJobData {
  triggeredAt?: string; // ISO string — for scheduled jobs
}

const processAnalytics = async (job: Job<AnalyticsJobData>) => {
  console.log(`[Analytics Worker] Processing job ${job.id}`);

  try {
    // ── Step 1: Get all distinct article+date combos from ReadLog ──
    // DATE_TRUNC in GMT — spec explicitly requires GMT timezone
    const rawCounts = await prisma.$queryRaw<{ articleId: string; date: Date; count: bigint }[]>`
      SELECT
        "articleId",
        DATE_TRUNC('day', "readAt" AT TIME ZONE 'GMT')::date AS date,
        COUNT(*)::bigint AS count
      FROM "ReadLogs"
      GROUP BY
        "articleId",
        DATE_TRUNC('day', "readAt" AT TIME ZONE 'GMT')::date
    `;

    if (rawCounts.length === 0) {
      console.log('[Analytics Worker] No read logs to process');
      return { processed: 0 };
    }

    // ── Step 2: Upsert each row into DailyAnalytics ──────────────
    // ON CONFLICT (articleId + date) → update viewCount
    // this is the exact logic the spec describes
    let processed = 0;

    await prisma.$transaction(async (tx) => {
      for (const row of rawCounts) {
        await tx.$executeRaw`
          INSERT INTO "DailyAnalytics" ("id", "articleId", "viewCount", "date")
          VALUES (
            gen_random_uuid(),
            ${row.articleId}::uuid,
            ${Number(row.count)},
            ${row.date}::date
          )
          ON CONFLICT ("articleId", "date")
          DO UPDATE SET
            "viewCount" = EXCLUDED."viewCount"
        `;
        processed++;
      }
    });

    console.log(`[Analytics Worker] Upserted ${processed} analytics rows`);
    return { processed };

  } catch (err) {
    console.error('[Analytics Worker] Job failed:', err);
    throw err; // rethrow — BullMQ will retry based on attempts config
  }
};

// ── Create the worker ─────────────────────────────────────────
export const analyticsWorker = new Worker<AnalyticsJobData>(
  'analytics',
  processAnalytics,
  {
    connection: redis,
    concurrency: 1, // analytics aggregation must be serial — no race conditions
  }
);

// ── Worker lifecycle events ───────────────────────────────────
analyticsWorker.on('completed', (job, result) => {
  console.log(
    `[Analytics Worker] Job ${job.id} completed. Processed: ${result.processed} rows`
  );
});

analyticsWorker.on('failed', (job, err) => {
  console.error(`[Analytics Worker] Job ${job?.id} failed:`, err.message);
});

analyticsWorker.on('error', (err) => {
  if (err.message?.includes('ECONNREFUSED') || (err as any).code === 'ECONNREFUSED') {
    return; // Silence connection error spam (handled in redis.ts)
  }
  console.error('[Analytics Worker] Worker error:', err);
});