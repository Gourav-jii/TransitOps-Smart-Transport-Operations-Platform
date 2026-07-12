import { Response } from 'express';
import mongoose from 'mongoose';
import FuelLog from '../models/FuelLog';
import Vehicle from '../models/Vehicle';
import Trip from '../models/Trip';
import { AuthRequest } from '../middlewares/authMiddleware';

const sendError = (res: Response, statusCode: number, message: string, errors: any[] = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

/**
 * @route   POST /api/v1/fuel
 * @desc    Create a new fuel log
 * @access  Private (Fleet Manager, Financial Analyst, Dispatcher)
 */
export const createFuelLog = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      vehicle,
      trip,
      fuelDate,
      liters,
      cost,
      fuelStation,
      odometer,
      paymentMethod,
      receiptNumber,
      remarks,
    } = req.body;

    if (!vehicle || liters === undefined || cost === undefined || !fuelStation || odometer === undefined || !paymentMethod) {
      return sendError(res, 400, 'Required fields are missing: vehicle, liters, cost, fuelStation, odometer, paymentMethod');
    }

    if (Number(liters) <= 0) {
      return sendError(res, 400, 'Fuel liters quantity must be greater than zero');
    }

    if (Number(cost) < 0) {
      return sendError(res, 400, 'Fuel cost cannot be negative');
    }

    if (Number(odometer) < 0) {
      return sendError(res, 400, 'Odometer reading cannot be negative');
    }

    // Validate vehicle
    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return sendError(res, 400, 'Assigned vehicle does not exist');
    }

    // Validate trip if provided
    if (trip) {
      const tripDoc = await Trip.findById(trip);
      if (!tripDoc) {
        return sendError(res, 400, 'Assigned trip does not exist');
      }
    }

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized request session');
    }

    const fuelLog = await FuelLog.create({
      vehicle,
      trip: trip || undefined,
      fuelDate: fuelDate || new Date(),
      liters: Number(liters),
      cost: Number(cost),
      fuelStation,
      odometer: Number(odometer),
      paymentMethod,
      receiptNumber,
      remarks,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Fuel log registered successfully',
      data: fuelLog,
    });
  } catch (error) {
    console.error('Create Fuel Log Error:', (error as Error).message);
    return sendError(res, 500, 'Server error creating fuel entry', [(error as Error).message]);
  }
};

/**
 * @route   GET /api/v1/fuel
 * @desc    Get fuel logs with search, sorting, filtering, and pagination
 * @access  Private (All Roles)
 */
export const getFuelLogs = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { search, vehicle, trip, startDate, endDate, sortBy, sortOrder } = req.query;

    const query: any = {};

    // Filters
    if (vehicle) query.vehicle = vehicle;
    if (trip) query.trip = trip;

    // Date range
    if (startDate || endDate) {
      query.fuelDate = {};
      if (startDate) query.fuelDate.$gte = new Date(startDate as string);
      if (endDate) query.fuelDate.$lte = new Date(endDate as string);
    }

    // Search matches receiptNumber, fuelStation, remarks or vehicle registration number
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      const orConditions: any[] = [
        { receiptNumber: searchRegex },
        { fuelStation: searchRegex },
        { remarks: searchRegex },
      ];

      // Try searching for vehicle plate
      const matchedVehicles = await Vehicle.find({ registrationNumber: searchRegex }).select('_id');
      if (matchedVehicles.length > 0) {
        orConditions.push({ vehicle: { $in: matchedVehicles.map((v) => v._id) } });
      }

      query.$or = orConditions;
    }

    // Sorting
    const sort: any = {};
    const allowedSortFields = ['fuelDate', 'cost', 'liters', 'pricePerLiter', 'createdAt'];
    const activeSortField = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : 'fuelDate';
    const activeSortOrder = sortOrder === 'asc' ? 1 : -1;
    sort[activeSortField] = activeSortOrder;

    const fuelLogs = await FuelLog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('vehicle')
      .populate('trip', 'tripNumber source destination')
      .populate('createdBy', 'name email role');

    const total = await FuelLog.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: 'Fuel logs fetched successfully',
      data: {
        fuelLogs,
        pagination: {
          total,
          page,
          limit,
          pages,
        },
      },
    });
  } catch (error) {
    console.error('Fetch Fuel Logs Error:', (error as Error).message);
    return sendError(res, 500, 'Server error fetching fuel logs', [(error as Error).message]);
  }
};

/**
 * @route   GET /api/v1/fuel/:id
 * @desc    Get single fuel log by ID
 * @access  Private (All Roles)
 */
export const getFuelLogById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid fuel log ID format');
    }

    const fuelLog = await FuelLog.findById(id)
      .populate('vehicle')
      .populate('trip', 'tripNumber source destination')
      .populate('createdBy', 'name email role');

    if (!fuelLog) {
      return sendError(res, 404, 'Fuel log not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Fuel log details retrieved successfully',
      data: fuelLog,
    });
  } catch (error) {
    console.error('Fetch Fuel Log ID Error:', (error as Error).message);
    return sendError(res, 500, 'Server error retrieving fuel log details', [(error as Error).message]);
  }
};

/**
 * @route   PUT /api/v1/fuel/:id
 * @desc    Update a fuel log
 * @access  Private (Fleet Manager, Financial Analyst only)
 */
export const updateFuelLog = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid fuel log ID format');
    }

    const { liters, cost, odometer, vehicle, trip } = req.body;

    if (liters !== undefined && Number(liters) <= 0) {
      return sendError(res, 400, 'Fuel liters quantity must be greater than zero');
    }

    if (cost !== undefined && Number(cost) < 0) {
      return sendError(res, 400, 'Fuel cost cannot be negative');
    }

    if (odometer !== undefined && Number(odometer) < 0) {
      return sendError(res, 400, 'Odometer reading cannot be negative');
    }

    // Validate vehicle if updated
    if (vehicle) {
      const vehicleDoc = await Vehicle.findById(vehicle);
      if (!vehicleDoc) {
        return sendError(res, 400, 'Assigned vehicle does not exist');
      }
    }

    // Validate trip if updated
    if (trip) {
      const tripDoc = await Trip.findById(trip);
      if (!tripDoc) {
        return sendError(res, 400, 'Assigned trip does not exist');
      }
    }

    const fuelLog = await FuelLog.findById(id);
    if (!fuelLog) {
      return sendError(res, 404, 'Fuel log not found');
    }

    // Apply updates (pre-save hook will recalculate pricePerLiter)
    Object.assign(fuelLog, req.body);
    await fuelLog.save();

    const populatedLog = await FuelLog.findById(id)
      .populate('vehicle')
      .populate('trip', 'tripNumber source destination')
      .populate('createdBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Fuel log updated successfully',
      data: populatedLog,
    });
  } catch (error) {
    console.error('Update Fuel Log Error:', (error as Error).message);
    return sendError(res, 500, 'Server error updating fuel log', [(error as Error).message]);
  }
};

/**
 * @route   DELETE /api/v1/fuel/:id
 * @desc    Delete a fuel log
 * @access  Private (Fleet Manager, Financial Analyst only)
 */
export const deleteFuelLog = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid fuel log ID format');
    }

    const fuelLog = await FuelLog.findById(id);
    if (!fuelLog) {
      return sendError(res, 404, 'Fuel log not found');
    }

    await FuelLog.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Fuel log deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete Fuel Log Error:', (error as Error).message);
    return sendError(res, 500, 'Server error deleting fuel log', [(error as Error).message]);
  }
};
