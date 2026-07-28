// testdb.js - Standard connection (non-SRV)
const mongoose = require('mongoose');

// Use Standard Connection (non-SRV)
const MONGO_URI = "mongodb://bahikhata_user2:mTyYrsjWAHFSglwg@ac-6uc3wd1-shard-00-00.eh8tycw.mongodb.net:27017,ac-6uc3wd1-shard-00-01.eh8tycw.mongodb.net:27017,ac-6uc3wd1-shard-00-02.eh8tycw.mongodb.net:27017/?ssl=true&replicaSet=atlas-fluju3-shard-0&authSource=admin&appName=Cluster0";
async function testConnection() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔌 Testing MongoDB Connection...');
  console.log('📡 Using Standard: mongodb://...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    });

    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name).join(', ') || '(empty)');
    
    await mongoose.disconnect();
    console.log('✅ Connection closed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 MongoDB is working!');
    process.exit(0);
    
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ MongoDB connection error:');
    console.error('   Message:', error.message);
    
    if (error.reason) {
      console.error('   Reason:', error.reason);
    }
    if (error.code) {
      console.error('   Code:', error.code);
    }
    
    // Common issues
    if (error.message.includes('whitelist')) {
      console.error('   💡 IP not whitelisted!');
      console.error('   → Add 0.0.0.0/0 in MongoDB Atlas Network Access');
    }
    if (error.message.includes('ECONNREFUSED')) {
      console.error('   💡 Connection refused!');
      console.error('   → Try mobile hotspot or check firewall');
    }
    if (error.message.includes('Authentication failed')) {
      console.error('   💡 Wrong username/password!');
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }
}

testConnection();