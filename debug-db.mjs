import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL
    }
  }
});

async function main() {
  const email = 'grichardomi@gmail.com';

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      Business: {
        include: {
          Competitor: true
        }
      },
      Subscription: true
    }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('\n=== USER ===');
  console.log('Email:', user.email);
  console.log('User ID:', user.id);

  console.log('\n=== SUBSCRIPTION ===');
  if (user.Subscription) {
    console.log('Status:', user.Subscription.status);
    console.log('Current Period End:', user.Subscription.currentPeriodEnd);
    console.log('Is expired?', user.Subscription.currentPeriodEnd < new Date());
  } else {
    console.log('NO SUBSCRIPTION FOUND!');
  }

  console.log('\n=== BUSINESS ===');
  if (user.Business) {
    console.log('Business ID:', user.Business.id);
    console.log('Business Name:', user.Business.name);

    console.log('\n=== COMPETITORS ===');
    console.log('Count:', user.Business.Competitor.length);
    for (const c of user.Business.Competitor) {
      console.log(`\n- ID: ${c.id}`);
      console.log(`  Name: ${c.name}`);
      console.log(`  URL: ${c.url}`);
      console.log(`  isActive: ${c.isActive}`);
      console.log(`  lastCrawledAt: ${c.lastCrawledAt}`);
      console.log(`  crawlFrequencyMinutes: ${c.crawlFrequencyMinutes}`);
      console.log(`  consecutiveFailures: ${c.consecutiveFailures}`);
    }
  } else {
    console.log('NO BUSINESS FOUND!');
  }

  // Check crawl queue
  console.log('\n=== CRAWL QUEUE ===');
  const queue = await prisma.crawlQueue.findMany();
  console.log('Jobs in queue:', queue.length);
  for (const job of queue) {
    console.log(`- Competitor ID: ${job.competitorId}, URL: ${job.url}, attempt: ${job.attempt}`);
  }

  // Check alerts for this user
  if (user.Business) {
    console.log('\n=== ALERTS ===');
    const alerts = await prisma.alert.findMany({
      where: { businessId: user.Business.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('Recent alerts:', alerts.length);
    for (const a of alerts) {
      console.log(`- Type: ${a.alertType}, Created: ${a.createdAt}, Message: ${a.message?.substring(0, 50)}`);
    }
  }

  // Run the scheduler query to see if this user's competitors would be picked up
  console.log('\n=== SCHEDULER QUERY TEST ===');
  const dueCompetitors = await prisma.$queryRaw`
    SELECT c.id, c.url, c."crawlFrequencyMinutes", c."lastCrawledAt", s.status, s."currentPeriodEnd"
    FROM "Competitor" c
    INNER JOIN "Business" b ON c."businessId" = b.id
    INNER JOIN "Subscription" s ON s."userId" = b."userId"
    WHERE c."isActive" = true
      AND (
        c."lastCrawledAt" IS NULL
        OR c."lastCrawledAt" + (c."crawlFrequencyMinutes" * INTERVAL '1 minute') < NOW()
      )
      AND NOT EXISTS (
        SELECT 1 FROM "CrawlQueue" cq
        WHERE cq."competitorId" = c.id
      )
      AND (
        s.status = 'active'
        OR (s.status = 'trialing' AND s."currentPeriodEnd" > NOW())
        OR (s.status = 'grace_period' AND s."currentPeriodEnd" + (3 * INTERVAL '1 day') > NOW())
      )
      AND s.status != 'paused'
    ORDER BY c."lastCrawledAt" ASC NULLS FIRST
    LIMIT 100
  `;
  console.log('Competitors that would be picked up by scheduler:', dueCompetitors.length);
  for (const c of dueCompetitors) {
    console.log(`- ID: ${c.id}, URL: ${c.url}, Status: ${c.status}, PeriodEnd: ${c.currentPeriodEnd}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
