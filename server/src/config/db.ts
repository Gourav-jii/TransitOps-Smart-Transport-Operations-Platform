import mongoose from 'mongoose';
import dns from 'dns';

export const connectDB = async (): Promise<void> => {
  try {
    // Configure public DNS servers to resolve MongoDB SRV records on networks with DNS restrictions
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    
    const connString = process.env.MONGODB_URI;
    if (!connString) {
      console.error('CRITICAL ERROR: MONGODB_URI environment variable is not defined.');
      process.exit(1);
    }
    
    console.log(`Connecting to remote MongoDB Atlas...`);
    const conn = await mongoose.connect(connString);
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${(error as Error).message}`);
    process.exit(1);
  }
};
