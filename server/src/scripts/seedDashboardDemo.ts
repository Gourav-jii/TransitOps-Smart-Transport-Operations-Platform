import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vehicle from '../models/Vehicle';
import Driver from '../models/Driver';
import Trip from '../models/Trip';
import MaintenanceLog from '../models/MaintenanceLog';
import FuelLog from '../models/FuelLog';
import Expense from '../models/Expense';
import User from '../models/User';
import Counter from '../models/Counter';

import dns from 'dns';

dotenv.config();

async function seed() {
  console.log('Connecting to database for demo dashboard seeding...');
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    const connString = process.env.MONGODB_URI;
    if (!connString) {
      console.error('Error: MONGODB_URI environment variable is not defined.');
      process.exit(1);
    }
    await mongoose.connect(connString);
    console.log('Connected to MongoDB.');

    // 1. Clean Collections
    console.log('Clearing existing operations data...');
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await MaintenanceLog.deleteMany({});
    await FuelLog.deleteMany({});
    await Expense.deleteMany({});
    await Counter.deleteMany({});

    // 2. Fetch Creator User
    const admin = await User.findOne({ role: 'Fleet Manager' });
    if (!admin) {
      console.error('Fleet Manager admin user not found. Please run npm run seed first.');
      process.exit(1);
    }
    const adminId = admin._id;

    // 3. Seed Vehicles
    console.log('Inserting vehicles...');
    const today = new Date();
    const futureDate = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const pastDate = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    const vehicles = await Vehicle.insertMany([
      {
        registrationNumber: 'DL-01-A-1234',
        vehicleName: 'Apex Prime Hauler',
        vehicleType: 'Truck',
        manufacturer: 'Tata Motors',
        model: 'Prima 4028.S',
        manufactureYear: 2022,
        currentOdometer: 45000,
        fuelType: 'Diesel',
        status: 'On Trip',
        region: 'North',
        insuranceExpiry: futureDate(15), // Expiring soon
        fitnessExpiry: futureDate(45),
        pollutionExpiry: pastDate(5), // Expired
        createdBy: adminId,
      },
      {
        registrationNumber: 'MH-12-Q-5678',
        vehicleName: 'City Transit Van',
        vehicleType: 'Van',
        manufacturer: 'Mahindra',
        model: 'Supro Cargo',
        manufactureYear: 2023,
        currentOdometer: 12000,
        fuelType: 'CNG',
        status: 'Available',
        region: 'West',
        insuranceExpiry: futureDate(90),
        fitnessExpiry: futureDate(12), // Expiring soon
        pollutionExpiry: futureDate(60),
        createdBy: adminId,
      },
      {
        registrationNumber: 'KA-03-M-9900',
        vehicleName: 'Express Logistic Trailer',
        vehicleType: 'Trailer',
        manufacturer: 'BharatBenz',
        model: '5528TT',
        manufactureYear: 2021,
        currentOdometer: 89000,
        fuelType: 'Diesel',
        status: 'In Shop',
        region: 'South',
        insuranceExpiry: futureDate(120),
        fitnessExpiry: futureDate(150),
        pollutionExpiry: futureDate(30),
        createdBy: adminId,
      },
      {
        registrationNumber: 'WB-02-Y-4321',
        vehicleName: 'Metro Container Hub',
        vehicleType: 'Container',
        manufacturer: 'Eicher',
        model: 'Pro 6040',
        manufactureYear: 2020,
        currentOdometer: 110000,
        fuelType: 'Diesel',
        status: 'Retired',
        region: 'East',
        insuranceExpiry: pastDate(20), // Expired
        fitnessExpiry: pastDate(10), // Expired
        pollutionExpiry: pastDate(30), // Expired
        createdBy: adminId,
      },
      {
        registrationNumber: 'DL-02-B-9988',
        vehicleName: 'Northern Freight Rig',
        vehicleType: 'Truck',
        manufacturer: 'Tata Motors',
        model: 'Signa 4825.T',
        manufactureYear: 2023,
        currentOdometer: 18000,
        fuelType: 'Diesel',
        status: 'Available',
        region: 'North',
        insuranceExpiry: futureDate(240),
        fitnessExpiry: futureDate(240),
        pollutionExpiry: futureDate(240),
        createdBy: adminId,
      },
    ]);

    // 4. Seed Drivers
    console.log('Inserting drivers...');
    const drivers = await Driver.insertMany([
      {
        fullName: 'John Miller',
        employeeId: 'EMP-000001',
        licenseNumber: 'DL-A1099238',
        licenseCategory: 'Commercial',
        licenseExpiry: futureDate(25), // Expiring soon
        contactNumber: '+919988776655',
        email: 'john.miller@transitops.com',
        status: 'On Trip',
        safetyScore: 92,
        region: 'North',
        createdBy: adminId,
      },
      {
        fullName: 'David Smith',
        employeeId: 'EMP-000002',
        licenseNumber: 'MH-B9928301',
        licenseCategory: 'Commercial',
        licenseExpiry: futureDate(120),
        contactNumber: '+919988776656',
        email: 'david.smith@transitops.com',
        status: 'Available',
        safetyScore: 71, // Low safety score
        region: 'West',
        createdBy: adminId,
      },
      {
        fullName: 'Sarah Jenkins',
        employeeId: 'EMP-000003',
        licenseNumber: 'KA-C8839201',
        licenseCategory: 'Commercial',
        licenseExpiry: pastDate(10), // Expired
        contactNumber: '+919988776657',
        email: 'sarah.j@transitops.com',
        status: 'Available',
        safetyScore: 95,
        region: 'South',
        createdBy: adminId,
      },
      {
        fullName: 'Richard Thompson',
        employeeId: 'EMP-000004',
        licenseNumber: 'WB-D7728394',
        licenseCategory: 'Commercial',
        licenseExpiry: futureDate(360),
        contactNumber: '+919988776658',
        email: 'richard.t@transitops.com',
        status: 'Suspended',
        safetyScore: 64, // Low safety score
        region: 'East',
        createdBy: adminId,
      },
    ]);

    // 5. Seed Trips
    console.log('Inserting trips across months...');
    // Create completed trips over the last 12 months for trends
    const tripInstances = [];
    const statusValues: Array<'Draft' | 'Dispatched' | 'Completed' | 'Cancelled'> = [
      'Completed',
      'Completed',
      'Completed',
      'Completed',
      'Completed',
      'Dispatched',
      'Draft',
      'Cancelled',
    ];

    for (let i = 0; i < 15; i++) {
      const monthOffset = i % 12;
      const tripDate = new Date();
      tripDate.setMonth(tripDate.getMonth() - monthOffset);
      tripDate.setDate(15);
      
      const v = vehicles[i % vehicles.length];
      const d = drivers[i % drivers.length];
      const status = i === 0 ? 'Dispatched' : i === 1 ? 'Draft' : i === 2 ? 'Cancelled' : 'Completed';
      
      await Trip.create({
        source: 'Warehouse Location A',
        destination: 'Distribution Hub ' + String.fromCharCode(65 + i),
        vehicle: v._id,
        driver: d._id,
        cargoWeight: 1200 + i * 150,
        plannedDistance: 350 + i * 20,
        actualDistance: status === 'Completed' ? 360 + i * 20 : undefined,
        plannedStartDate: tripDate,
        actualStartDate: status !== 'Draft' ? tripDate : undefined,
        completedDate: status === 'Completed' ? tripDate : undefined,
        fuelConsumed: status === 'Completed' ? 80 + i * 4 : undefined,
        startingOdometer: 10000 + i * 500,
        endingOdometer: status === 'Completed' ? 10360 + i * 500 : undefined,
        revenue: status === 'Completed' ? 1500 + i * 200 : undefined,
        estimatedRevenue: 1400 + i * 200,
        status,
        createdBy: adminId,
      });
    }

    // 6. Seed Maintenance Logs
    console.log('Inserting maintenance logs...');
    await MaintenanceLog.create({
      vehicle: vehicles[0]._id,
      maintenanceType: 'Oil Change',
      title: 'Routine 40k Miles Fluid and Filter Swap',
      description: 'Swapped engine oil, primary transmission fluids, and cabin filters.',
      vendor: 'Apex Tata Service Hub',
      technician: 'David Carter',
      estimatedCost: 150.0,
      actualCost: 165.0,
      scheduledDate: pastDate(25),
      startDate: pastDate(25),
      endDate: pastDate(25),
      status: 'Completed',
      priority: 'Low',
      remarks: 'All clean. No issues found.',
      createdBy: adminId,
    });

    await MaintenanceLog.create({
      vehicle: vehicles[2]._id,
      maintenanceType: 'Brake Service',
      title: 'Brake Liner and Shoes Replacements',
      description: 'Air brake diagnostic error code resolving, swapped front brake liners.',
      vendor: 'Express Rig Mechanics',
      technician: 'Marcus Vance',
      estimatedCost: 1200.0,
      scheduledDate: pastDate(2),
      startDate: pastDate(2),
      status: 'Active',
      priority: 'High',
      remarks: 'Brake assemblies disassembled, waiting for liners delivery.',
      createdBy: adminId,
    });

    await MaintenanceLog.create({
      vehicle: vehicles[4]._id,
      maintenanceType: 'Tyre Replacement',
      title: 'Replace Rear Radial Tyres',
      description: 'Scheduled replacement of four bald tyres.',
      vendor: 'Radial Grip Masters',
      technician: 'Steven Cole',
      estimatedCost: 800.0,
      scheduledDate: futureDate(5),
      status: 'Scheduled',
      priority: 'Medium',
      createdBy: adminId,
    });

    // 7. Seed Fuel Logs
    console.log('Inserting fuel logs across months...');
    for (let i = 0; i < 15; i++) {
      const monthOffset = i % 12;
      const fuelDate = new Date();
      fuelDate.setMonth(fuelDate.getMonth() - monthOffset);
      fuelDate.setDate(10);

      const v = vehicles[i % vehicles.length];

      await FuelLog.create({
        vehicle: v._id,
        fuelDate,
        liters: 120 + i * 5,
        cost: 150 + i * 15,
        pricePerLiter: Number(((150 + i * 15) / (120 + i * 5)).toFixed(3)),
        fuelStation: 'Circle K Fuel Station #' + (i % 5 + 1),
        odometer: 20000 + i * 350,
        paymentMethod: 'Corporate Card',
        createdBy: adminId,
      });
    }

    // 8. Seed Expenses
    console.log('Inserting expenses...');
    for (let i = 0; i < 10; i++) {
      const monthOffset = i % 12;
      const expenseDate = new Date();
      expenseDate.setMonth(expenseDate.getMonth() - monthOffset);
      expenseDate.setDate(20);

      const v = vehicles[i % vehicles.length];

      await Expense.create({
        vehicle: v._id,
        expenseType: i % 3 === 0 ? 'Toll' : i % 3 === 1 ? 'Parking' : 'Insurance',
        amount: 50.0 + i * 35,
        expenseDate,
        vendor: 'Highway Authority Corp',
        description: 'Toll plaza charges and administrative parking receipts.',
        createdBy: adminId,
      });
    }

    console.log('======================================================');
    console.log('Demo Seeding Completed: Operation collections populated.');
    console.log('======================================================');
  } catch (error) {
    console.error('Demo seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Mongoose disconnected.');
  }
}

seed();
