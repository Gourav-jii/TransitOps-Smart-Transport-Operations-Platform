import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://localhost:27017/transitops';
    console.log(`Connecting to MongoDB at: ${connString.replace(/:([^@:]+)@/, ':****@')}`);
    
    const conn = await mongoose.connect(connString);
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${(error as Error).message}`);
    console.warn("Express server will continue running without database connectivity. Check your MongoDB status.");
  }
};
