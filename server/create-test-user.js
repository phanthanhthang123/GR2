const db = require('./src/models');
const bcrypt = require('bcrypt');

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await db.Users.findOne({
      where: { email: 'test@example.com' }
    });

    if (existingUser) {
      console.log('Test user already exists:', existingUser.dataValues);
      return existingUser;
    }

    // Create new test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const newUser = await db.Users.create({
      id: 'U_TEST_001',
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'Admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Test user created successfully:', newUser.dataValues);
    return newUser;
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser().then(() => {
  console.log('Script completed');
  process.exit(0);
});
