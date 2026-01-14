/**
 * Diagnose alerts issue - check why count doesn't match displayed alerts
 */
import { db } from '../lib/db/prisma';

async function main() {
  const email = process.argv[2] || 'info@objectmodule.com';
  
  console.log(`\n🔍 Diagnosing alerts for: ${email}\n`);
  
  // Get user and their businesses
  const user = await db.user.findUnique({
    where: { email },
    include: { Business: true }
  });
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log(`👤 User: ${user.name || user.email} (ID: ${user.id})`);
  console.log(`📊 Businesses: ${user.Business.length}`);
  
  for (const business of user.Business) {
    console.log(`\n--- Business: ${business.name} (ID: ${business.id}) ---`);
    
    // Count all alerts for this business
    const totalAlerts = await db.alert.count({
      where: { businessId: business.id }
    });
    console.log(`Total alerts: ${totalAlerts}`);
    
    // Count by alert type
    const byType = await db.alert.groupBy({
      by: ['alertType'],
      where: { businessId: business.id },
      _count: true
    });
    console.log(`By type:`, byType.map(t => `${t.alertType}: ${t._count}`).join(', '));
    
    // List all alerts
    const alerts = await db.alert.findMany({
      where: { businessId: business.id },
      include: { Competitor: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\nAll alerts for this business:`);
    for (const alert of alerts) {
      console.log(`  - ID: ${alert.id} | Type: ${alert.alertType} | Competitor: ${alert.Competitor?.name || 'N/A'} | Read: ${alert.isRead} | Date: ${alert.createdAt.toISOString().split('T')[0]}`);
    }
  }
  
  // Check if there are alerts not linked to any business this user owns
  const businessIds = user.Business.map(b => b.id);
  const orphanedAlerts = await db.alert.findMany({
    where: {
      businessId: { notIn: businessIds }
    },
    include: { 
      Business: { select: { name: true, userId: true } },
      Competitor: { select: { name: true } }
    },
    take: 10
  });
  
  if (orphanedAlerts.length > 0) {
    console.log(`\n⚠️  Alerts belonging to OTHER businesses:`);
    for (const alert of orphanedAlerts) {
      console.log(`  - ID: ${alert.id} | Type: ${alert.alertType} | Business: ${alert.Business?.name} (userId: ${alert.Business?.userId})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
