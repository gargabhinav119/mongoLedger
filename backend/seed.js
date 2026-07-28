// backend/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function seedAdmin() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 Seeding Admin User...');
    console.log('📡 Using URI from .env');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Use same connection options as testdb.js
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.db.databaseName);

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin exists
    const existing = await Admin.findOne({ username });
    if (existing) {
      console.log(`✅ Admin "${username}" already exists`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create new admin
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = new Admin({
      username,
      passwordHash
    });

    await admin.save();

    console.log('✅ Admin created successfully!');
    console.log(`   👤 Username: ${username}`);
    console.log(`   🔑 Password: ${password}`);
    console.log('   ⚠️  Change password in .env for production!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Seed error:', error.message);
    if (error.reason) {
      console.error('   Reason:', error.reason);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }
}

seedAdmin();