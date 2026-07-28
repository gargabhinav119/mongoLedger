// import-data.js - data.json ko MongoDB format me convert karega
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Customer = require('./models/Customer');

// Aapka connection string
const MONGO_URI = "mongodb://bahikhata_user2:mTyYrsjWAHFSglwg@ac-6uc3wd1-shard-00-00.eh8tycw.mongodb.net:27017,ac-6uc3wd1-shard-00-01.eh8tycw.mongodb.net:27017,ac-6uc3wd1-shard-00-02.eh8tycw.mongodb.net:27017/?ssl=true&replicaSet=atlas-fluju3-shard-0&authSource=admin&appName=Cluster0";

// 👇 Aapki shop ID
const SHOP_ID = "6a67304843c9c6a1b25ed1f0";

async function importData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ MongoDB connected');

    // Read data.json
    const dataPath = path.join(__dirname, 'data.json');
    
    // Check if data.json exists
    if (!fs.existsSync(dataPath)) {
      console.error('❌ data.json not found! Make sure it\'s in the backend folder.');
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`📊 Total customers in data.json: ${data.customers.length}`);

    // 🔄 FORMAT CONVERT - add shopId to each customer
    const customersToInsert = data.customers.map(customer => ({
      shopId: SHOP_ID,
      id: customer.id,
      name: customer.name,
      createdAt: customer.createdAt,
      entries: customer.entries || []
    }));

    console.log(`📝 Converting format: Added shopId to all ${customersToInsert.length} customers`);

    // Delete existing data for this shop (avoid duplicates)
    const deleted = await Customer.deleteMany({ shopId: SHOP_ID });
    console.log(`🗑️ Deleted ${deleted.deletedCount} existing customers for this shop`);

    // Insert new data
    if (customersToInsert.length > 0) {
      await Customer.insertMany(customersToInsert);
      console.log(`✅ ${customersToInsert.length} customers imported successfully!`);
    } else {
      console.log('⚠️ No customers to import');
    }

    console.log('🎉 Done! Check your dashboard.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Import error:', error.message);
    if (error.code === 11000) {
      console.error('💡 Duplicate key error. Some customers may already exist.');
    }
    process.exit(1);
  }
}

importData();