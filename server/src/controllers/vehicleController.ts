import { Response } from 'express';
import mongoose from 'mongoose';
import Vehicle, { IVehicle } from '../models/Vehicle';
import { AuthRequest } from '../middlewares/authMiddleware';

/**
 * Helper to validate Mongoose ObjectId
 */
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Helper to format error responses consistently
 */
const sendError = (res: Response, statusCode: number, message: string, errors: any[] = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

/**
 * @route   POST /api/v1/vehicles
 * @desc    Create a new vehicle
 * @access  Private (Fleet Manager only)
 */
export const createVehicle = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      registrationNumber,
      vehicleName,
      model,
      manufacturer,
      vehicleType,
      region,
      maximumLoadCapacity,
      currentOdometer,
      acquisitionCost,
      purchaseDate,
      status,
      fuelType,
      insuranceExpiry,
      fitnessExpiry,
      pollutionExpiry,
      remarks,
    } = req.body;

    // Required field validation
    if (!registrationNumber || !vehicleName || !model || !manufacturer || !vehicleType) {
      return sendError(res, 400, 'Required fields are missing: registrationNumber, vehicleName, model, manufacturer, vehicleType');
    }

    // Capacity validation
    if (maximumLoadCapacity !== undefined && Number(maximumLoadCapacity) <= 0) {
      return sendError(res, 400, 'Maximum load capacity must be greater than zero');
    }

    // Odometer validation
    if (currentOdometer !== undefined && Number(currentOdometer) < 0) {
      return sendError(res, 400, 'Current odometer reading cannot be negative');
    }

    // Cost validation
    if (acquisitionCost !== undefined && Number(acquisitionCost) < 0) {
      return sendError(res, 400, 'Acquisition cost cannot be negative');
    }

    // Format registration number (Trim & Uppercase)
    const formattedRegNo = registrationNumber.trim().toUpperCase();

    // Check for duplicate registration number
    const duplicate = await Vehicle.findOne({ registrationNumber: formattedRegNo });
    if (duplicate) {
      return sendError(res, 400, `Vehicle with registration number '${formattedRegNo}' already exists`);
    }

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized request session');
    }

    // Create Vehicle
    const vehicle = await Vehicle.create({
      registrationNumber: formattedRegNo,
      vehicleName,
      model,
      manufacturer,
      vehicleType,
      region,
      maximumLoadCapacity,
      currentOdometer: currentOdometer || 0,
      acquisitionCost,
      purchaseDate,
      status: status || 'Available',
      fuelType,
      insuranceExpiry,
      fitnessExpiry,
      pollutionExpiry,
      remarks,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      data: vehicle,
    });
  } catch (error) {
    console.error('Create Vehicle Error:', (error as Error).message);
    return sendError(res, 500, 'Server error creating vehicle record', [(error as Error).message]);
  }
};

/**
 * @route   GET /api/v1/vehicles
 * @desc    Fetch vehicles with search, sorting, filtering, and pagination
 * @access  Private (All Roles)
 */
export const getVehicles = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { search, status, vehicleType, region, sortBy, sortOrder } = req.query;

    // Build filter query object
    const query: any = {};

    // Filter by type, status, region
    if (status) query.status = status;
    if (vehicleType) query.vehicleType = vehicleType;
    if (region) query.region = region;

    // Search matches plate, name, model, region
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { registrationNumber: searchRegex },
        { vehicleName: searchRegex },
        { model: searchRegex },
        { region: searchRegex },
      ];
    }

    // Sorting
    const sort: any = {};
    const allowedSortFields = ['registrationNumber', 'vehicleName', 'purchaseDate', 'maximumLoadCapacity', 'createdAt'];
    const activeSortField = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const activeSortOrder = sortOrder === 'asc' ? 1 : -1;
    sort[activeSortField] = activeSortOrder;

    // Query DB
    const vehicles = await Vehicle.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email role');

    const total = await Vehicle.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: 'Vehicles fetched successfully',
      data: {
        vehicles,
        pagination: {
          total,
          page,
          limit,
          pages,
        },
      },
    });
  } catch (error) {
    console.error('Fetch Vehicles Error:', (error as Error).message);
    return sendError(res, 500, 'Server error fetching vehicle registry', [(error as Error).message]);
  }
};

/**
 * @route   GET /api/v1/vehicles/:id
 * @desc    Fetch a single vehicle by ID
 * @access  Private (All Roles)
 */
export const getVehicleById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid vehicle ID format');
    }

    const vehicle = await Vehicle.findById(id).populate('createdBy', 'name email role');
    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle details fetched successfully',
      data: vehicle,
    });
  } catch (error) {
    console.error('Fetch Vehicle ID Error:', (error as Error).message);
    return sendError(res, 500, 'Server error retrieving vehicle details', [(error as Error).message]);
  }
};

/**
 * @route   PUT /api/v1/vehicles/:id
 * @desc    Update a vehicle record
 * @access  Private (Fleet Manager only)
 */
export const updateVehicle = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid vehicle ID format');
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    // Business Rule: Retired vehicles cannot be edited except remarks
    if (vehicle.status === 'Retired') {
      const updateKeys = Object.keys(req.body);
      const invalidEdits = updateKeys.filter(
        (key) => key !== 'remarks' && req.body[key] !== (vehicle as any)[key]
      );
      
      // If they modified fields other than 'remarks', reject the request
      if (invalidEdits.length > 0) {
        return sendError(
          res,
          400,
          `Business Restriction: Vehicle is 'Retired'. Only remarks can be edited. Disallowed fields: ${invalidEdits.join(', ')}`
        );
      }
    }

    // Validation checks
    const { maximumLoadCapacity, currentOdometer, acquisitionCost, registrationNumber } = req.body;

    if (maximumLoadCapacity !== undefined && Number(maximumLoadCapacity) <= 0) {
      return sendError(res, 400, 'Maximum load capacity must be greater than zero');
    }

    if (currentOdometer !== undefined && Number(currentOdometer) < 0) {
      return sendError(res, 400, 'Current odometer reading cannot be negative');
    }

    if (acquisitionCost !== undefined && Number(acquisitionCost) < 0) {
      return sendError(res, 400, 'Acquisition cost cannot be negative');
    }

    // Registration number duplicate validation (if updated)
    if (registrationNumber) {
      const formattedRegNo = registrationNumber.trim().toUpperCase();
      if (formattedRegNo !== vehicle.registrationNumber) {
        const duplicate = await Vehicle.findOne({ registrationNumber: formattedRegNo });
        if (duplicate) {
          return sendError(res, 400, `Vehicle with registration number '${formattedRegNo}' already exists`);
        }
        req.body.registrationNumber = formattedRegNo;
      }
    }

    // Apply updates
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: updatedVehicle,
    });
  } catch (error) {
    console.error('Update Vehicle Error:', (error as Error).message);
    return sendError(res, 500, 'Server error updating vehicle record', [(error as Error).message]);
  }
};

/**
 * @route   DELETE /api/v1/vehicles/:id
 * @desc    Delete a vehicle record
 * @access  Private (Fleet Manager only)
 */
export const deleteVehicle = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid vehicle ID format');
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return sendError(res, 404, 'Vehicle not found');
    }

    // Business Rule: If vehicle status is On Trip or In Shop, delete should be blocked
    if (vehicle.status === 'On Trip' || vehicle.status === 'In Shop') {
      return sendError(
        res,
        400,
        `Business Restriction: Cannot delete vehicle while status is '${vehicle.status}'`
      );
    }

    await Vehicle.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete Vehicle Error:', (error as Error).message);
    return sendError(res, 500, 'Server error deleting vehicle record', [(error as Error).message]);
  }
};
