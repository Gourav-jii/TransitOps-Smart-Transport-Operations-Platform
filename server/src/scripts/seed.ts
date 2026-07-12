import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

import dns from 'dns';

// Load environmental variables
dotenv.config();

const seedDB = async (): Promise<void> => {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    const connString = process.env.MONGODB_URI;
    if (!connString) {
      console.error('Error: MONGODB_URI environment variable is not defined.');
      process.exit(1);
    }
    console.log(`Connecting to database for seeding...`);
    await mongoose.connect(connString);
    console.log('Connected to MongoDB.');

    // Clear existing users
    console.log('Cleaning User collection...');
    await User.deleteMany({});
    console.log('User collection cleared.');

    // Demo user accounts
    const demoAccounts = [
      {
        name: 'Arthur Pendragon',
        email: 'manager@transitops.com',
        password: 'Password@123',
        role: 'Fleet Manager' as const,
        avatar: '',
        isActive: true,
      },
      {
        name: 'Guinevere Le Fay',
        email: 'dispatcher@transitops.com',
        password: 'Password@123',
        role: 'Dispatcher' as const,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&q=80',
        isActive: true,
      },
      {
        name: 'Lancelot du Lac',
        email: 'safety@transitops.com',
        password: 'Password@123',
        role: 'Safety Officer' as const,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&q=80',
        isActive: true,
      },
      {
        name: 'Merlin Ambrosius',
        email: 'finance@transitops.com',
        password: 'Password@123',
        role: 'Financial Analyst' as const,
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=128&h=128&fit=crop&q=80',
        isActive: true,
      },
    ];

    console.log('Inserting demo accounts...');
    const users = await User.create(demoAccounts);
    
    console.log('\n==================================================');
    console.log('Demo Users Seeded Successfully:');
    console.log('==================================================');
    users.forEach((user) => {
      console.log(`Role:     ${user.role}`);
      console.log(`Name:     ${user.name}`);
      console.log(`Email:    ${user.email}`);
      console.log(`Password: Password@123`);
      console.log('--------------------------------------------------');
    });
    console.log('==================================================\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
