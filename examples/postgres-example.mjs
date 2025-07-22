import PostgresIntegration from '../src/utils/postgres-integration.js';

const testPostgres = async () => {
  try {
    console.log('🔍 Testing PostgreSQL connection...');
    const pg = new PostgresIntegration();
    
    // Test 1: Get current timestamp
    console.log('\n📅 Test 1: Getting current timestamp');
    const timeResult = await pg.executeQuery('SELECT NOW()');
    console.log('Current time:', timeResult[0].now);
    
    // Test 2: Get PostgreSQL version
    console.log('\n🔧 Test 2: Getting PostgreSQL version');
    const versionResult = await pg.executeQuery('SELECT version()');
    console.log('PostgreSQL version:', versionResult[0].version);
    
    // Test 3: List databases
    console.log('\n📊 Test 3: Listing databases');
    const dbResult = await pg.executeQuery('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('Available databases:', dbResult.map(row => row.datname));

    // Test 4: List tables in the current database
    console.log('\n📋 Test 4: Listing tables in the current database');
    const tableResult = await pg.executeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Available tables:', tableResult.map(row => row.table_name));

    console.log('\n✅ All tests completed successfully!');
    
    // Close the connection
    await pg.close();
    console.log('🔌 Connection closed.');
  } catch (error) {
    console.error('❌ PostgreSQL test failed:', error.message);
  }
};

testPostgres();
