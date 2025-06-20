const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createAdmin() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/league-pick-ban';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const users = db.collection('users');
    
    const existingAdmin = await users.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@league-pick-ban.com';
    
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const adminUser = {
      id: uuidv4(),
      username: adminUsername,
      password: hashedPassword,
      email: adminEmail,
      isAdmin: true,
      sessionsCreatedToday: 0,
      lastSessionDate: '',
      createdAt: new Date()
    };
    
    await users.insertOne(adminUser);
    
    console.log('Admin user created successfully!');
    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Email: ${adminEmail}`);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.close();
  }
}

createAdmin(); 