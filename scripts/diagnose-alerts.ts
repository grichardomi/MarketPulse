import { db } from '@/lib/db/prisma';

async function diagnoseAlerts() {
  console.log('=== Alert Diagnosis ===\n');

  // 1. Check users
  console.log('1. Checking users...');
  const users = await db.user.findMany({
    select: { id: true, email: true, name: true },
    take: 5,
  });
  console.log(`   Found ${users.length} users:`);
  users.forEach(u => console.log(`   - ${u.email} (ID: ${u.id})`));

  // 2. Check businesses
  console.log('\n2. Checking businesses...');
  const businesses = await db.business.findMany({
    select: { id: true, name: true, userId: true },
  });
  console.log(`   Found ${businesses.length} businesses:`);
  businesses.forEach(b => console.log(`   - ${b.name} (ID: ${b.id}, UserID: ${b.userId})`));

  // 3. Check competitors
  console.log('\n3. Checking competitors...');
  const competitors = await db.competitor.findMany({
    select: { id: true, name: true, businessId: true },
  });
  console.log(`   Found ${competitors.length} competitors:`);
  competitors.forEach(c => console.log(`   - ${c.name} (ID: ${c.id}, BusinessID: ${c.businessId})`));

  // 4. Check alerts
  console.log('\n4. Checking alerts...');
  const alerts = await db.alert.findMany({
    select: { id: true, businessId: true, alertType: true, message: true },
    take: 10,
  });
  console.log(`   Found ${alerts.length} alerts:`);
  alerts.forEach(a => console.log(`   - ${a.alertType} (ID: ${a.id}, BusinessID: ${a.businessId})`));

  // 5. Check user-business-alert chain for first user
  if (users.length > 0) {
    const firstUser = users[0];
    console.log(`\n5. Checking alert chain for user: ${firstUser.email}`);

    const userWithData = await db.user.findUnique({
      where: { id: firstUser.id },
      include: {
        Business: {
          include: {
            Alert: true,
            Competitor: true,
          },
        },
      },
    });

    if (!userWithData?.Business || userWithData.Business.length === 0) {
      console.log('   ❌ User has NO business');
    } else {
      const business = userWithData.Business[0];
      console.log(`   ✓ User has business: ${business.name} (ID: ${business.id})`);
      console.log(`   - Competitors: ${business.Competitor.length}`);
      console.log(`   - Alerts: ${business.Alert.length}`);

      if (business.Alert.length > 0) {
        console.log('\n   Alert details:');
        business.Alert.slice(0, 3).forEach(a => {
          console.log(`   - ${a.alertType}: ${a.message.substring(0, 50)}...`);
        });
      }
    }
  }

  console.log('\n=== Diagnosis Complete ===');
}

diagnoseAlerts()
  .catch(console.error)
  .finally(() => process.exit());
