import { Response } from 'express';
import mongoose from 'mongoose';
import Trip, { ITrip } from '../models/Trip';
import Vehicle from '../models/Vehicle';
import Driver from '../models/Driver';
import { AuthRequest } from '../middlewares/authMiddleware';

const sendError = (res: Response, statusCode: number, message: string, errors: any[] = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

/**
 * Common Trip Validations helper
 */
const validateTripInputs = async (
  vehicleId: string,
  driverId: string,
  cargoWeight: number,
  plannedDistance: number,
  estimatedRevenue: number,
  source: string,
  destination: string,
  isUpdate: boolean = false,
  currentTripId?: string
) => {
  if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
    return 'Source cannot be equal to destination';
  }

  if (plannedDistance !== undefined && Number(plannedDistance) <= 0) {
    return 'Planned distance must be greater than zero';
  }

  if (estimatedRevenue !== undefined && Number(estimatedRevenue) < 0) {
    return 'Estimated revenue cannot be negative';
  }

  // Fetch Vehicle
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return 'Assigned vehicle does not exist';
  }

  // Fetch Driver
  const driver = await Driver.findById(driverId);
  if (!driver) {
    return 'Assigned driver does not exist';
  }

  // Validate driver license expiry
  if (new Date(driver.licenseExpiry) < new Date()) {
    return `Driver license is expired (Expired on ${new Date(driver.licenseExpiry).toLocaleDateString()})`;
  }

  // Validate Cargo Weight <= Capacity
  const capacity = vehicle.maximumLoadCapacity || 0;
  if (cargoWeight > capacity) {
    return `Cargo weight (${cargoWeight} kg) exceeds vehicle's maximum load capacity (${capacity} kg)`;
  }

  // On creation (or if vehicle/driver changed during update), check availability
  if (!isUpdate) {
    if (vehicle.status !== 'Available') {
      return `Vehicle is not available (Current status: ${vehicle.status})`;
    }
    if (driver.status !== 'Available') {
      return `Driver is not available (Current status: ${driver.status})`;
    }
  } else if (currentTripId) {
    // For updates, check if vehicle changed and if new vehicle is available
    const existingTrip = await Trip.findById(currentTripId);
    if (existingTrip) {
      if (existingTrip.vehicle.toString() !== vehicleId && vehicle.status !== 'Available') {
        return `New vehicle is not available (Current status: ${vehicle.status})`;
      }
      if (existingTrip.driver.toString() !== driverId && driver.status !== 'Available') {
        return `New driver is not available (Current status: ${driver.status})`;
      }
    }
  }

  return null;
};

/**
 * @route   POST /api/v1/trips
 * @desc    Create a new trip in Draft state
 * @access  Private (Fleet Manager or Dispatcher)
 */
export const createTrip = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      source,
      destination,
      vehicle,
      driver,
      cargoWeight,
      plannedDistance,
      plannedStartDate,
      expectedCompletionDate,
      startingOdometer,
      estimatedRevenue,
      remarks,
    } = req.body;

    if (!source || !destination || !vehicle || !driver || cargoWeight === undefined || !plannedStartDate || startingOdometer === undefined) {
      return sendError(res, 400, 'Required parameters are missing: source, destination, vehicle, driver, cargoWeight, plannedStartDate, startingOdometer');
    }

    // Run custom validations
    const validationError = await validateTripInputs(
      vehicle,
      driver,
      Number(cargoWeight),
      Number(plannedDistance),
      Number(estimatedRevenue || 0),
      source,
      destination
    );

    if (validationError) {
      return sendError(res, 400, validationError);
    }

    // Set starting Odometer checking
    const vehicleDoc = await Vehicle.findById(vehicle);
    if (vehicleDoc && Number(startingOdometer) < vehicleDoc.currentOdometer) {
      return sendError(
        res,
        400,
        `Starting odometer (${startingOdometer} km) cannot be less than the vehicle's current odometer (${vehicleDoc.currentOdometer} km)`
      );
    }

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized session');
    }

    // Create Draft Trip
    const trip = await Trip.create({
      source,
      destination,
      vehicle,
      driver,
      cargoWeight,
      plannedDistance,
      plannedStartDate,
      expectedCompletionDate,
      startingOdometer,
      estimatedRevenue,
      remarks,
      status: 'Draft',
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Trip created successfully as Draft',
      data: trip,
    });
  } catch (error) {
    console.error('Create Trip Error:', (error as Error).message);
    return sendError(res, 500, 'Server error creating trip record', [(error as Error).message]);
  }
};

/**
 * @route   GET /api/v1/trips
 * @desc    Fetch trips with advanced search, sorting, filtering, and pagination
 * @access  Private (All Roles)
 */
export const getTrips = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { search, status, vehicle, driver, startDate, endDate, region, sortBy, sortOrder } = req.query;

    const query: any = {};

    // Filters
    if (status) query.status = status;
    if (vehicle) query.vehicle = vehicle;
    if (driver) query.driver = driver;

    // Date Range (filters by plannedStartDate)
    if (startDate || endDate) {
      query.plannedStartDate = {};
      if (startDate) query.plannedStartDate.$gte = new Date(startDate as string);
      if (endDate) query.plannedStartDate.$lte = new Date(endDate as string);
    }

    // Region Filter (trips mapped to vehicle's region)
    if (region) {
      const vehiclesInRegion = await Vehicle.find({ region: region as string }).select('_id');
      query.vehicle = { $in: vehiclesInRegion.map((v) => v._id) };
    }

    // Search matches Trip Number, Source, Destination
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      const orConditions: any[] = [
        { tripNumber: searchRegex },
        { source: searchRegex },
        { destination: searchRegex },
      ];

      // Try searching for vehicle plate
      const matchedVehicles = await Vehicle.find({ registrationNumber: searchRegex }).select('_id');
      if (matchedVehicles.length > 0) {
        orConditions.push({ vehicle: { $in: matchedVehicles.map((v) => v._id) } });
      }

      // Try searching for driver name
      const matchedDrivers = await Driver.find({ fullName: searchRegex }).select('_id');
      if (matchedDrivers.length > 0) {
        orConditions.push({ driver: { $in: matchedDrivers.map((d) => d._id) } });
      }

      query.$or = orConditions;
    }

    // Sorting
    const sort: any = {};
    const allowedSortFields = ['tripNumber', 'plannedStartDate', 'revenue', 'estimatedRevenue', 'plannedDistance', 'status', 'createdAt'];
    const activeSortField = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const activeSortOrder = sortOrder === 'asc' ? 1 : -1;
    sort[activeSortField] = activeSortOrder;

    const trips = await Trip.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('vehicle')
      .populate('driver')
      .populate('createdBy', 'name email role');

    const total = await Trip.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: 'Trips fetched successfully',
      data: {
        trips,
        pagination: {
          total,
          page,
          limit,
          pages,
        },
      },
    });
  } catch (error) {
    console.error('Fetch Trips Error:', (error as Error).message);
    return sendError(res, 500, 'Server error fetching trip registry', [(error as Error).message]);
  }
};

/**
 * @route   GET /api/v1/trips/:id
 * @desc    Get trip by ID with detailed logs and audits
 * @access  Private (All Roles)
 */
export const getTripById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid trip ID format');
    }

    const trip = await Trip.findById(id)
      .populate('vehicle')
      .populate('driver')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role')
      .populate('dispatchedBy', 'name email role')
      .populate('completedBy', 'name email role')
      .populate('cancelledBy', 'name email role');

    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Trip details retrieved',
      data: trip,
    });
  } catch (error) {
    console.error('Fetch Trip ID Error:', (error as Error).message);
    return sendError(res, 500, 'Server error retrieving trip details', [(error as Error).message]);
  }
};

/**
 * @route   PUT /api/v1/trips/:id
 * @desc    Update a trip details (Allowed ONLY in Draft state)
 * @access  Private (Fleet Manager or Dispatcher)
 */
export const updateTrip = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid trip ID format');
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }

    // Verification check: Only Draft status can be edited
    if (trip.status !== 'Draft') {
      return sendError(res, 400, `Cannot edit trip. Trip is currently '${trip.status}' (Only 'Draft' trips are editable)`);
    }

    const {
      source,
      destination,
      vehicle,
      driver,
      cargoWeight,
      plannedDistance,
      plannedStartDate,
      expectedCompletionDate,
      startingOdometer,
      estimatedRevenue,
      remarks,
    } = req.body;

    const validationError = await validateTripInputs(
      vehicle || trip.vehicle.toString(),
      driver || trip.driver.toString(),
      cargoWeight !== undefined ? Number(cargoWeight) : trip.cargoWeight,
      plannedDistance !== undefined ? Number(plannedDistance) : trip.plannedDistance || 0,
      estimatedRevenue !== undefined ? Number(estimatedRevenue) : trip.estimatedRevenue || 0,
      source || trip.source,
      destination || trip.destination,
      true,
      id
    );

    if (validationError) {
      return sendError(res, 400, validationError);
    }

    if (startingOdometer !== undefined) {
      const vehicleDoc = await Vehicle.findById(vehicle || trip.vehicle);
      if (vehicleDoc && Number(startingOdometer) < vehicleDoc.currentOdometer) {
        return sendError(
          res,
          400,
          `Starting odometer (${startingOdometer} km) cannot be less than the vehicle's current odometer (${vehicleDoc.currentOdometer} km)`
        );
      }
    }

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized request session');
    }

    // Apply updates
    const updatedTrip = await Trip.findByIdAndUpdate(
      id,
      {
        $set: {
          ...req.body,
          updatedBy: req.user._id,
        },
      },
      { new: true, runValidators: true }
    ).populate('vehicle').populate('driver');

    return res.status(200).json({
      success: true,
      message: 'Trip updated successfully',
      data: updatedTrip,
    });
  } catch (error) {
    console.error('Update Trip Error:', (error as Error).message);
    return sendError(res, 500, 'Server error updating trip record', [(error as Error).message]);
  }
};

/**
 * @route   DELETE /api/v1/trips/:id
 * @desc    Delete a trip (Allowed ONLY in Draft or Cancelled status)
 * @access  Private (Fleet Manager or Dispatcher)
 */
export const deleteTrip = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid trip ID format');
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }

    // Delete rule: Only Draft or Cancelled trips can be deleted. Completed trips can NEVER be deleted.
    if (trip.status === 'Completed') {
      return sendError(res, 400, 'Completed trips can never be deleted from the system');
    }
    if (trip.status === 'Dispatched') {
      return sendError(res, 400, 'Dispatched trips cannot be deleted. Cancel the trip first.');
    }

    await Trip.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Trip deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete Trip Error:', (error as Error).message);
    return sendError(res, 500, 'Server error deleting trip record', [(error as Error).message]);
  }
};

/**
 * @route   PATCH /api/v1/trips/:id/dispatch
 * @desc    Dispatch a trip (Draft -> Dispatched)
 * @access  Private (Fleet Manager or Dispatcher)
 */
export const dispatchTrip = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid trip ID format');
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }

    if (trip.status !== 'Draft') {
      return sendError(res, 400, `Cannot dispatch. Trip is already in '${trip.status}' state`);
    }

    // Prevent race conditions: atomically update Vehicle and Driver status to 'On Trip' ONLY if they are currently 'Available'
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: trip.vehicle, status: 'Available' },
      { $set: { status: 'On Trip' } },
      { new: true }
    );

    if (!vehicle) {
      return sendError(res, 400, 'Assigned vehicle is no longer Available (might be on another trip or in shop)');
    }

    const driver = await Driver.findOneAndUpdate(
      { _id: trip.driver, status: 'Available' },
      { $set: { status: 'On Trip' } },
      { new: true }
    );

    if (!driver) {
      // Rollback vehicle update to keep database in sync
      await Vehicle.findByIdAndUpdate(trip.vehicle, { $set: { status: 'Available' } });
      return sendError(res, 400, 'Assigned driver is no longer Available (might be on another trip or suspended)');
    }

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized request session');
    }

    // Transition Trip to Dispatched
    trip.status = 'Dispatched';
    trip.actualStartDate = new Date();
    trip.dispatchedAt = new Date();
    trip.dispatchedBy = req.user._id;

    await trip.save();

    return res.status(200).json({
      success: true,
      message: 'Trip dispatched successfully',
      data: trip,
    });
  } catch (error) {
    console.error('Dispatch Trip Error:', (error as Error).message);
    return sendError(res, 500, 'Server error dispatching trip', [(error as Error).message]);
  }
};

/**
 * @route   PATCH /api/v1/trips/:id/complete
 * @desc    Complete a trip (Dispatched -> Completed)
 * @access  Private (Fleet Manager or Dispatcher)
 */
export const completeTrip = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { endingOdometer, actualDistance, fuelConsumed, completionRemarks, completedDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid trip ID format');
    }

    if (endingOdometer === undefined || actualDistance === undefined || fuelConsumed === undefined) {
      return sendError(res, 400, 'Required completion fields are missing: endingOdometer, actualDistance, fuelConsumed');
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }

    if (trip.status !== 'Dispatched') {
      return sendError(res, 400, `Cannot complete. Trip is currently in '${trip.status}' state (only 'Dispatched' trips can be completed)`);
    }

    // Validation: endingOdometer must be >= startingOdometer
    if (Number(endingOdometer) < trip.startingOdometer) {
      return sendError(
        res,
        400,
        `Ending odometer (${endingOdometer} km) cannot be less than the starting odometer (${trip.startingOdometer} km)`
      );
    }

    if (Number(actualDistance) < 0 || Number(fuelConsumed) < 0) {
      return sendError(res, 400, 'Actual distance and fuel consumed cannot be negative values');
    }

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized request session');
    }

    // Complete the trip
    trip.status = 'Completed';
    trip.endingOdometer = Number(endingOdometer);
    trip.actualDistance = Number(actualDistance);
    trip.fuelConsumed = Number(fuelConsumed);
    trip.remarks = completionRemarks || trip.remarks;
    trip.completedDate = completedDate ? new Date(completedDate) : new Date();
    trip.completedBy = req.user._id;

    await trip.save();

    // Release Vehicle: status On Trip -> Available and update odometer
    await Vehicle.findByIdAndUpdate(trip.vehicle, {
      $set: {
        status: 'Available',
        currentOdometer: Number(endingOdometer),
      },
    });

    // Release Driver: status On Trip -> Available
    await Driver.findByIdAndUpdate(trip.driver, {
      $set: { status: 'Available' },
    });

    return res.status(200).json({
      success: true,
      message: 'Trip completed successfully',
      data: trip,
    });
  } catch (error) {
    console.error('Complete Trip Error:', (error as Error).message);
    return sendError(res, 500, 'Server error completing trip', [(error as Error).message]);
  }
};

/**
 * @route   PATCH /api/v1/trips/:id/cancel
 * @desc    Cancel a trip (Allowed in Draft or Dispatched state)
 * @access  Private (Fleet Manager or Dispatcher)
 */
export const cancelTrip = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid trip ID format');
    }

    if (!cancellationReason) {
      return sendError(res, 400, 'Cancellation reason is required');
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return sendError(res, 404, 'Trip not found');
    }

    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      return sendError(res, 400, `Cannot cancel. Trip is already in '${trip.status}' state`);
    }

    const originalStatus = trip.status;

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized request session');
    }

    // Cancel the trip
    trip.status = 'Cancelled';
    trip.cancelledAt = new Date();
    trip.cancelledBy = req.user._id;
    trip.cancellationReason = cancellationReason;

    await trip.save();

    // If trip was Dispatched, restore Vehicle and Driver back to 'Available'
    if (originalStatus === 'Dispatched') {
      await Vehicle.findByIdAndUpdate(trip.vehicle, {
        $set: { status: 'Available' },
      });
      await Driver.findByIdAndUpdate(trip.driver, {
        $set: { status: 'Available' },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Trip cancelled successfully',
      data: trip,
    });
  } catch (error) {
    console.error('Cancel Trip Error:', (error as Error).message);
    return sendError(res, 500, 'Server error cancelling trip', [(error as Error).message]);
  }
};

/**
 * @route   GET /api/v1/trips/drivers/available
 * @desc    Get all available drivers for dispatch dropdown
 * @access  Private (Fleet Manager or Dispatcher)
 */
export const getAvailableDrivers = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const drivers = await Driver.find({
      status: 'Available',
      licenseExpiry: { $gt: new Date() },
    });
    return res.status(200).json({
      success: true,
      message: 'Available drivers fetched successfully',
      data: drivers,
    });
  } catch (error) {
    console.error('Fetch Available Drivers Error:', (error as Error).message);
    return sendError(res, 500, 'Server error fetching available drivers', [(error as Error).message]);
  }
};
