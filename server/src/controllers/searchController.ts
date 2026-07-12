import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import Vehicle from '../models/Vehicle';
import Driver from '../models/Driver';
import Trip from '../models/Trip';
import MaintenanceLog from '../models/MaintenanceLog';
import FuelLog from '../models/FuelLog';
import Expense from '../models/Expense';

/**
 * @route   GET /api/v1/search
 * @desc    Global debounced search across all collections
 * @access  Private (All Roles)
 */
export const globalSearch = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const searchStr = q.trim();
    const regex = new RegExp(searchStr, 'i');

    // Run searches in parallel
    const [vehicles, drivers, trips, maintenance, fuelLogs, expenses] = await Promise.all([
      Vehicle.find({
        $or: [{ registrationNumber: regex }, { vehicleName: regex }],
      }).limit(5),
      Driver.find({
        $or: [{ fullName: regex }, { employeeId: regex }, { licenseNumber: regex }],
      }).limit(5),
      Trip.find({
        $or: [{ tripNumber: regex }, { source: regex }, { destination: regex }],
      }).limit(5),
      MaintenanceLog.find({
        $or: [{ maintenanceId: regex }, { title: regex }, { vendor: regex }],
      }).limit(5),
      FuelLog.find({
        $or: [{ fuelLogId: regex }, { fuelStation: regex }],
      }).limit(5),
      Expense.find({
        $or: [{ expenseId: regex }, { vendor: regex }, { description: regex }],
      }).limit(5),
    ]);

    const results: any[] = [];

    // Map and aggregate format
    vehicles.forEach((v) => {
      results.push({
        id: v._id,
        title: v.registrationNumber,
        subtitle: `${v.manufacturer} ${v.model} (${v.vehicleName})`,
        category: 'Vehicles',
        link: '/vehicles',
      });
    });

    drivers.forEach((d) => {
      results.push({
        id: d._id,
        title: d.fullName,
        subtitle: `${d.employeeId} - License: ${d.licenseNumber}`,
        category: 'Drivers',
        link: '/drivers',
      });
    });

    trips.forEach((t) => {
      results.push({
        id: t._id,
        title: t.tripNumber,
        subtitle: `${t.source} ➔ ${t.destination} [${t.status}]`,
        category: 'Trips',
        link: '/trips',
      });
    });

    maintenance.forEach((m) => {
      results.push({
        id: m._id,
        title: m.maintenanceId || 'MNT-UNKNOWN',
        subtitle: `${m.maintenanceType} - ${m.vendor} (${m.status})`,
        category: 'Maintenance',
        link: `/maintenance/${m._id}`,
      });
    });

    fuelLogs.forEach((f) => {
      results.push({
        id: f._id,
        title: f.fuelLogId || 'FUEL-UNKNOWN',
        subtitle: `${f.fuelStation} - ${f.liters}L ($${f.cost})`,
        category: 'Fuel Logs',
        link: '/fuel-logs',
      });
    });

    expenses.forEach((e) => {
      results.push({
        id: e._id,
        title: e.expenseId || 'EXP-UNKNOWN',
        subtitle: `${e.expenseType} - ${e.vendor} ($${e.amount})`,
        category: 'Expenses',
        link: '/expenses',
      });
    });

    // Support / FAQ placeholders matching reports/support search items
    const staticItems = [
      { id: 'supp-1', title: 'System Documentation & Setup', subtitle: 'Global user guides and platform deployment scripts', category: 'Support', link: '/settings' },
      { id: 'supp-2', title: 'Reports & Export Center', subtitle: 'Extract analytical summaries and billing invoices', category: 'Reports', link: '/reports' },
    ];

    staticItems.forEach(item => {
      if (item.title.match(regex) || item.subtitle.match(regex)) {
        results.push(item);
      }
    });

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};
