import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const notifications = await prisma.notification.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  console.log('Total Notifications in DB:', await prisma.notification.count());
  console.log('Recent Notifications:');
  notifications.forEach(n => {
    console.log(`ID: ${n.id} | UserID: ${n.userId} | Message: ${n.message} | isRead: ${n.isRead}`);
  });

  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, name: true, email: true, role: true }
  });
  console.log('\nRecent Users:');
  users.forEach(u => {
    console.log(`ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
