const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createAdmin() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminUsername) {
    console.error('ADMIN_USERNAME environment variable is required');
    process.exit(1);
  }

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable is required');
    process.exit(1);
  }

  if (adminPassword.length < 12) {
    console.error('ADMIN_PASSWORD must be at least 12 characters long');
    process.exit(1);
  }

  if (!adminEmail) {
    console.error('ADMIN_EMAIL environment variable is required');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const users = db.collection('users');
    
    const existingAdmin = await users.findOne({ username: adminUsername });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
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
    console.log(`Email: ${adminEmail}`);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.close();
  }
}

createAdmin(); 