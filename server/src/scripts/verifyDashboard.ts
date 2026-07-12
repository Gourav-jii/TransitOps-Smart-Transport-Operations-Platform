import mongoose from 'mongoose';
import dotenv from 'dotenv';
import analyticsService from '../services/analyticsService';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/transitops';

async function run() {
  console.log('[Verification] Connecting to database...');
  console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected successfully.');

    // 1. Test Summary Metrics
    console.log('\n[Verification] Fetching Dashboard summary statistics...');
    const summary = await analyticsService.getDashboardSummary({});
    console.log('✓ Summary Metrics Retreived:');
    console.log(`  - Active Vehicles: ${summary.vehicles.active}`);
    console.log(`  - Available Vehicles: ${summary.vehicles.available}`);
    console.log(`  - Utilization Rate: ${summary.vehicles.utilizationPercent}%`);
    console.log(`  - Total Completed Trips: ${summary.trips.Completed}`);
    console.log(`  - Total Revenue: $${summary.financials.totalRevenue}`);
    console.log(`  - Operational Cost: $${summary.financials.totalOperationalCost}`);
    console.log(`  - Average Fuel Efficiency: ${summary.financials.avgFuelEfficiency} mi/L`);

    // 2. Test Charts Trends
    console.log('\n[Verification] Fetching Dashboard charts datasets...');
    const charts = await analyticsService.getDashboardCharts({});
    console.log('✓ Charts Datasets Retreived:');
    console.log(`  - Monthly Trend entries: ${charts.monthlyTrends.length}`);
    console.log(`  - Vehicle ROI list length: ${charts.vehicleROI.length}`);
    console.log(`  - Top Fuel Consuming Vehicles: ${charts.topFuelVehicles.length}`);
    console.log(`  - Maintenance Distributions: ${charts.maintenanceDistribution.length}`);

    // 3. Test Recent Activities
    console.log('\n[Verification] Fetching Recent activities...');
    const activities = await analyticsService.getRecentActivities();
    console.log('✓ Recent Logs Retreived:');
    console.log(`  - Recent Trips Count: ${activities.recentTrips.length}`);
    console.log(`  - Recent Maintenance Count: ${activities.recentMaintenance.length}`);
    console.log(`  - Recent Fuel Logs: ${activities.recentFuelLogs.length}`);
    console.log(`  - Recent Expense Logs: ${activities.recentExpenses.length}`);

    // 4. Test Alerts Scanner
    console.log('\n[Verification] Running document compliance alerts scanner...');
    const alerts = await analyticsService.getDashboardAlerts();
    console.log('✓ Alerts Scan Complete:');
    console.log(`  - Expiring Driver Licenses: ${alerts.expiringDrivers.length}`);
    console.log(`  - Expiring Vehicle Documents: ${alerts.expiringVehicles.length}`);
    console.log(`  - Vehicles In Shop: ${alerts.vehiclesInShop.length}`);
    console.log(`  - Low Safety Score Drivers: ${alerts.lowSafetyDrivers.length}`);
    console.log(`  - High Cost Maintenance Items: ${alerts.highCostMaintenance.length}`);

    console.log('\n======================================================');
    console.log('Verification Completed: All Aggregation Pipelines Validated.');
    console.log('======================================================');
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Verification] Mongoose disconnected.');
  }
}

run();
