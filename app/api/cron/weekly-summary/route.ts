import { NextRequest, NextResponse } from 'next/server';
import { processWeeklySummaries } from '@/services/weekly-summary';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Weekly Summary Cron Job
 * GET /api/cron/weekly-summary
 *
 * Runs once a week (every Monday at 9am) to send weekly summary emails
 * to all users with active competitors.
 *
 * The email includes:
 * - Number of competitors monitored
 * - Price changes detected this week
 * - Competitor stability status
 * - Quick tips and insights
 *
 * Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret
  const cronSecret = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('Weekly summary cron triggered');

    const stats = await processWeeklySummaries();

    const elapsed = Date.now() - startTime;
    const message = `Weekly summary: processed ${stats.processed}, sent ${stats.sent}, skipped ${stats.skipped}, errors ${stats.errors}`;

    console.log(message);

    return NextResponse.json(
      {
        status: 'success',
        message,
        timestamp: new Date().toISOString(),
        stats,
        elapsedMs: elapsed,
      },
      { status: 200 }
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Weekly summary cron error:', error);

    return NextResponse.json(
      {
        status: 'error',
        error: errorMessage,
        timestamp: new Date().toISOString(),
        elapsedMs: elapsed,
      },
      { status: 500 }
    );
  }
}
