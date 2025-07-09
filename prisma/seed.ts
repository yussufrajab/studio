import { PrismaClient } from '@prisma/client'
import { USERS, INSTITUTIONS } from '@/lib/constants';
import bcrypt from 'bcryptjs';

const db = new PrismaClient()

async function main() {
    console.log('Seeding database...');

    console.log('Seeding institutions...');
    for (const institution of INSTITUTIONS) {
        await db.institution.upsert({
            where: { name: institution.name },
            update: {},
            create: {
                name: institution.name,
            },
        });
    }
    console.log('Institutions seeded successfully!');

    console.log('Fetching seeded institutions to get their IDs...');
    const seededInstitutions = await db.institution.findMany();
    const institutionMap = new Map(seededInstitutions.map(inst => [inst.name, inst.id]));

    console.log('Seeding users...');
    const salt = await bcrypt.genSalt(10);

    for (const user of USERS) {
        const institutionName = user.institution || 'TUME YA UTUMISHI SERIKALINI';
        const institutionId = institutionMap.get(institutionName);

        if (!institutionId) {
            console.warn(`Could not find institution ID for: ${institutionName}. Skipping user: ${user.name}`);
            continue;
        }

        await db.user.upsert({
            where: { username: user.username },
            update: {},
            create: {
                name: user.name,
                username: user.username,
                password: await bcrypt.hash('password123', salt), // Default password for all users
                role: user.role as string,
                active: true,
                employeeId: user.employeeId,
                institutionId: institutionId,
            },
        });
    }
    console.log('Users seeded successfully!');
    console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
