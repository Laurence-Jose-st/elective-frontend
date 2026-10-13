import prisma from './lib/prisma.js';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    // Check what tables exist in the database
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('✅ Existing tables in database:');
    if (tables.length === 0) {
      console.log('   No tables found. You need to run: npx prisma db push');
    } else {
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }
    
    // Try to count users if the table exists
    const userTableExists = tables.some(t => t.table_name === 'users');
    if (userTableExists) {
      const count = await prisma.users.count();
      console.log(`✅ Found ${count} users in database`);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();