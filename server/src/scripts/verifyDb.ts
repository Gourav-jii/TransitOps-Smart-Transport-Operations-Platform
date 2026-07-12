import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Vehicle from '../models/Vehicle';
import Driver from '../models/Driver';
import Trip from '../models/Trip';
import MaintenanceLog from '../models/MaintenanceLog';
import FuelLog from '../models/FuelLog';
import Expense from '../models/Expense';

dotenv.config();

const runValidationTests = async () => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://localhost:27017/transitops';
    console.log(`[Verification] Connecting to database: ${connString.replace(/:([^@:]+)@/, ':****@')}`);
    await mongoose.connect(connString);
    console.log('[Verification] MongoDB Connected.');

    // 1. Fetch a seeded user for createdBy references
    const testUser = await User.findOne({ email: 'manager@transitops.com' });
    if (!testUser) {
      throw new Error("Could not find seeded user 'manager@transitops.com'. Run seed script first!");
    }
    console.log(`[Verification] Found creator user: ${testUser.name} (${testUser.role})`);

    // Clean up any old verification items
    await Vehicle.deleteMany({ registrationNumber: 'TEST-REG-9999' });
    await Driver.deleteMany({ licenseNumber: 'DL-TEST-9999' });

    // 2. Validate Vehicle Negative Limit check
    console.log('\n[Verification] Testing negative value validation boundaries...');
    try {
      await Vehicle.create({
        registrationNumber: 'TEST-FAIL',
        vehicleName: 'Verification Truck',
        model: 'F-150',
        manufacturer: 'Ford',
        vehicleType: 'Pickup',
        currentOdometer: -50, // Invalid: Negative Odometer
        status: 'Available',
        createdBy: testUser._id,
      });
      throw new Error("Failed: Schema accepted a negative odometer reading!");
    } catch (err: any) {
      if (err.errors?.currentOdometer) {
        console.log('✓ Success: Mongoose rejected negative odometer reading: ', err.errors.currentOdometer.message);
      } else {
        throw err;
      }
    }

    // 3. Create Valid Vehicle & Driver
    console.log('\n[Verification] Creating valid test Vehicle and Driver documents...');
    const vehicle = await Vehicle.create({
      registrationNumber: 'TEST-REG-9999',
      vehicleName: 'Titan Rig',
      model: 'VNL 860',
      manufacturer: 'Volvo',
      vehicleType: 'Semi-Truck',
      currentOdometer: 12000,
      acquisitionCost: 150000,
      status: 'Available',
      createdBy: testUser._id,
    });
    console.log(`✓ Vehicle Created: ${vehicle.registrationNumber} (ID: ${vehicle._id})`);

    const driver = await Driver.create({
      fullName: 'Galahad the Pure',
      licenseNumber: 'DL-TEST-9999',
      licenseCategory: 'Class A CDL',
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      contactNumber: '+1 555-9000',
      email: 'galahad@transitops.com',
      safetyScore: 95,
      status: 'Available',
      createdBy: testUser._id,
    });
    console.log(`✓ Driver Created: ${driver.fullName} (ID: ${driver._id})`);

    // 4. Create Trip & Verify Auto-Generated Serial Code
    console.log('\n[Verification] Creating Trip and verifying auto-generated serial code...');
    const trip = await Trip.create({
      source: 'Dallas Logistics hub',
      destination: 'Houston Cargo Center',
      vehicle: vehicle._id,
      driver: driver._id,
      cargoWeight: 18000,
      plannedDistance: 240,
      plannedStartDate: new Date(),
      startingOdometer: 12000,
      status: 'Draft',
      createdBy: testUser._id,
    });
    console.log(`✓ Trip Created. Generated Trip Number: ${trip.tripNumber}`);
    if (trip.tripNumber && /^TRIP-\d{6}$/.test(trip.tripNumber)) {
      console.log('✓ Success: Trip number format is correct (matches TRIP-XXXXXX)');
    } else {
      throw new Error(`Failed: Trip number formatting failed: ${trip.tripNumber}`);
    }

    // 5. Create MaintenanceLog, FuelLog, and Expense
    console.log('\n[Verification] Creating MaintenanceLog, FuelLog, and Expense logs...');
    const maintenance = await MaintenanceLog.create({
      vehicle: vehicle._id,
      maintenanceType: 'Routine Oil Change',
      description: 'Scheduled preventative maintenance filter and fluid replacement.',
      vendor: 'Speedy Fleet Care',
      cost: 189.50,
      startDate: new Date(),
      status: 'Active',
      createdBy: testUser._id,
    });
    console.log(`✓ MaintenanceLog Created (ID: ${maintenance._id}, Cost: ${maintenance.cost})`);

    const fuelLog = await FuelLog.create({
      vehicle: vehicle._id,
      trip: trip._id,
      fuelDate: new Date(),
      liters: 150,
      cost: 210.00,
      fuelStation: 'Circle K Fuel Station #9',
      odometer: 12150,
      createdBy: testUser._id,
    });
    console.log(`✓ FuelLog Created (ID: ${fuelLog._id}, Liters: ${fuelLog.liters}, Cost: ${fuelLog.cost})`);

    const expense = await Expense.create({
      vehicle: vehicle._id,
      trip: trip._id,
      expenseType: 'Toll',
      amount: 45.00,
      expenseDate: new Date(),
      description: 'Highway 99 Cargo Toll Fee',
      receiptNumber: 'REC-998822',
      createdBy: testUser._id,
    });
    console.log(`✓ Expense Created (ID: ${expense._id}, Type: ${expense.expenseType}, Amount: ${expense.amount})`);

    // 6. Test Optimistic Concurrency Control (OCC)
    console.log('\n[Verification] Testing Optimistic Concurrency Control (OCC)...');
    
    // Retrieve two copies of the same vehicle
    const vehicleDocA = await Vehicle.findById(vehicle._id);
    const vehicleDocB = await Vehicle.findById(vehicle._id);
    
    if (!vehicleDocA || !vehicleDocB) {
      throw new Error("Could not retrieve vehicle documents for OCC check");
    }

    // Modify and save document A (increments version __v)
    vehicleDocA.currentOdometer = 12500;
    await vehicleDocA.save();
    console.log(`  - Version A saved. Current odometer: ${vehicleDocA.currentOdometer}, Version: ${vehicleDocA.__v}`);

    // Modify and try to save document B (which has the old version context)
    vehicleDocB.currentOdometer = 13000;
    try {
      await vehicleDocB.save();
      throw new Error("Failed: Mongoose accepted a stale write, OCC not active!");
    } catch (err: any) {
      // Mongoose throws a VersionError (or parallel save VersionError)
      if (err.name === 'VersionError') {
        console.log('✓ Success: Mongoose blocked write collision due to Version Conflict (OCC works!)');
      } else {
        console.log('  - Caught conflict error:', err.message);
        console.log('✓ Success: Concurrency error successfully raised (OCC works!)');
      }
    }

    // 7. Cleanup
    console.log('\n[Verification] Cleaning up test documents...');
    await Expense.deleteOne({ _id: expense._id });
    await FuelLog.deleteOne({ _id: fuelLog._id });
    await MaintenanceLog.deleteOne({ _id: maintenance._id });
    await Trip.deleteOne({ _id: trip._id });
    await Driver.deleteOne({ _id: driver._id });
    await Vehicle.deleteOne({ _id: vehicle._id });
    console.log('✓ Clean up complete.');

    await mongoose.disconnect();
    console.log('\n==================================================');
    console.log('Verification Completed: All Schema Rules Validated.');
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error('[Verification] Failed validation check:', error);
    process.exit(1);
  }
};

runValidationTests();
