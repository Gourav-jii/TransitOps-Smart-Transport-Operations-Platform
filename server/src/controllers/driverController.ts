import { Response } from 'express';
import mongoose from 'mongoose';
import Driver, { IDriver } from '../models/Driver';
import Trip from '../models/Trip';
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
 * Regex for validation
 */
const phoneRegex = /^[\d\s+\-()]{7,20}$/;
const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

/**
 * @route   POST /api/v1/drivers
 * @desc    Create a new driver
 * @access  Private (Fleet Manager only)
 */
export const createDriver = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      fullName,
      licenseNumber,
      licenseCategory,
      licenseExpiry,
      contactNumber,
      email,
      address,
      emergencyContactName,
      emergencyContactNumber,
      joiningDate,
      safetyScore,
      experience,
      region,
      remarks,
      status,
    } = req.body;

    // Required fields check
    if (!fullName || !licenseNumber || !licenseCategory || !licenseExpiry || !contactNumber) {
      return sendError(res, 400, 'Required fields are missing: fullName, licenseNumber, licenseCategory, licenseExpiry, contactNumber');
    }

    // Phone format validation
    if (!phoneRegex.test(contactNumber)) {
      return sendError(res, 400, 'Contact number is in an invalid format');
    }

    // Email format validation (if provided)
    if (email && !emailRegex.test(email)) {
      return sendError(res, 400, 'Email address is in an invalid format');
    }

    // Experience validation
    if (experience !== undefined && Number(experience) < 0) {
      return sendError(res, 400, 'Experience cannot be negative');
    }

    // Safety score validation
    const score = safetyScore !== undefined ? Number(safetyScore) : 100;
    if (score < 0 || score > 100) {
      return sendError(res, 400, 'Safety score must be between 0 and 100');
    }

    // License expiry: must be future date
    const expiryDate = new Date(licenseExpiry);
    const today = new Date();
    if (isNaN(expiryDate.getTime())) {
      return sendError(res, 400, 'License expiry date is invalid');
    }
    if (expiryDate <= today) {
      return sendError(res, 400, 'License expiry date must be a future date');
    }

    // Format license number (trim and uppercase)
    const formattedLicense = licenseNumber.trim().toUpperCase();

    // Check for duplicate license number
    const duplicate = await Driver.findOne({ licenseNumber: formattedLicense });
    if (duplicate) {
      return sendError(res, 400, `Driver with license number '${formattedLicense}' already exists`);
    }

    // Business Rule: Expired license (if somehow expired, though future date checks it, let's enforce status check)
    const activeStatus = status || 'Available';
    if (expiryDate <= today && activeStatus === 'Available') {
      return sendError(res, 400, "Business Restriction: Driver with an expired license cannot have 'Available' status");
    }

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized request session');
    }

    // Create Driver
    const driver = await Driver.create({
      fullName,
      licenseNumber: formattedLicense,
      licenseCategory,
      licenseExpiry: expiryDate,
      contactNumber,
      email,
      address,
      emergencyContactName,
      emergencyContactNumber,
      joiningDate: joiningDate || new Date(),
      safetyScore: score,
      experience: experience || 0,
      region,
      remarks,
      status: activeStatus,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Driver registered successfully',
      data: driver,
    });
  } catch (error) {
    console.error('Create Driver Error:', (error as Error).message);
    return sendError(res, 500, 'Server error creating driver record', [(error as Error).message]);
  }
};

/**
 * @route   GET /api/v1/drivers
 * @desc    Fetch drivers with search, sorting, filtering, and pagination
 * @access  Private (All Roles: Fleet Manager, Dispatcher, Safety Officer, Financial Analyst)
 */
export const getDrivers = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const {
      search,
      status,
      region,
      licenseCategory,
      minSafetyScore,
      maxSafetyScore,
      expiringSoon,
      sortBy,
      sortOrder,
    } = req.query;

    const query: any = {};

    // Standard filters
    if (status) query.status = status;
    if (region) query.region = region;
    if (licenseCategory) query.licenseCategory = licenseCategory;

    // Safety Score Range filter
    if (minSafetyScore !== undefined || maxSafetyScore !== undefined) {
      query.safetyScore = {};
      if (minSafetyScore !== undefined) query.safetyScore.$gte = Number(minSafetyScore);
      if (maxSafetyScore !== undefined) query.safetyScore.$lte = Number(maxSafetyScore);
    }

    // License Expiring Soon filter (within 30 days)
    if (expiringSoon === 'true') {
      const today = new Date();
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      query.licenseExpiry = { $gte: today, $lte: thirtyDaysFromNow };
    }

    // Search query matches Name, Employee ID, License, or Phone
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { fullName: searchRegex },
        { employeeId: searchRegex },
        { licenseNumber: searchRegex },
        { contactNumber: searchRegex },
      ];
    }

    // Sorting parameters mapping
    const sort: any = {};
    const allowedSortFields = ['fullName', 'joiningDate', 'safetyScore', 'licenseExpiry', 'createdAt'];
    const activeSortField = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const activeSortOrder = sortOrder === 'asc' ? 1 : -1;
    sort[activeSortField] = activeSortOrder;

    // Execute queries
    const drivers = await Driver.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email role');

    const total = await Driver.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: 'Drivers fetched successfully',
      data: {
        drivers,
        pagination: {
          total,
          page,
          limit,
          pages,
        },
      },
    });
  } catch (error) {
    console.error('Fetch Drivers Error:', (error as Error).message);
    return sendError(res, 500, 'Server error fetching driver directory', [(error as Error).message]);
  }
};

/**
 * @route   GET /api/v1/drivers/:id
 * @desc    Fetch a single driver by ID
 * @access  Private (All Roles)
 */
export const getDriverById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid driver ID format');
    }

    const driver = await Driver.findById(id).populate('createdBy', 'name email role');
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Driver details fetched successfully',
      data: driver,
    });
  } catch (error) {
    console.error('Fetch Driver ID Error:', (error as Error).message);
    return sendError(res, 500, 'Server error retrieving driver details', [(error as Error).message]);
  }
};

/**
 * @route   PUT /api/v1/drivers/:id
 * @desc    Update a driver record
 * @access  Private (Fleet Manager only)
 */
export const updateDriver = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid driver ID format');
    }

    const driver = await Driver.findById(id);
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    const {
      fullName,
      licenseNumber,
      licenseCategory,
      licenseExpiry,
      contactNumber,
      email,
      address,
      emergencyContactName,
      emergencyContactNumber,
      joiningDate,
      safetyScore,
      experience,
      region,
      remarks,
      status,
    } = req.body;

    // Field-level validations
    if (contactNumber && !phoneRegex.test(contactNumber)) {
      return sendError(res, 400, 'Contact number is in an invalid format');
    }

    if (email && !emailRegex.test(email)) {
      return sendError(res, 400, 'Email address is in an invalid format');
    }

    if (experience !== undefined && Number(experience) < 0) {
      return sendError(res, 400, 'Experience cannot be negative');
    }

    if (safetyScore !== undefined) {
      const score = Number(safetyScore);
      if (score < 0 || score > 100) {
        return sendError(res, 400, 'Safety score must be between 0 and 100');
      }
    }

    // License expiry validation (must be future date)
    let expiryDate = driver.licenseExpiry;
    if (licenseExpiry) {
      expiryDate = new Date(licenseExpiry);
      const today = new Date();
      if (isNaN(expiryDate.getTime())) {
        return sendError(res, 400, 'License expiry date is invalid');
      }
      if (expiryDate <= today) {
        return sendError(res, 400, 'License expiry date must be a future date');
      }
    }

    // License number unique duplicate validation
    if (licenseNumber) {
      const formattedLicense = licenseNumber.trim().toUpperCase();
      if (formattedLicense !== driver.licenseNumber) {
        const duplicate = await Driver.findOne({ licenseNumber: formattedLicense });
        if (duplicate) {
          return sendError(res, 400, `Driver with license number '${formattedLicense}' already exists`);
        }
        req.body.licenseNumber = formattedLicense;
      }
    }

    // Business Rule: Expired License -> Driver cannot become Available
    const targetStatus = status || driver.status;
    const targetExpiry = expiryDate;
    const today = new Date();
    if (targetExpiry <= today && targetStatus === 'Available') {
      return sendError(res, 400, "Business Restriction: Driver with an expired license cannot become 'Available'");
    }

    // Business Rule: Driver on Trip -> Cannot change status manually while assigned to active Trip
    const activeTrip = await Trip.findOne({ driver: id, status: 'Dispatched' });
    if (activeTrip && status && status !== driver.status) {
      return sendError(res, 400, "Business Restriction: Cannot change status manually while driver is assigned to an active Trip");
    }

    // Apply updates
    const updatedDriver = await Driver.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Driver profile updated successfully',
      data: updatedDriver,
    });
  } catch (error) {
    console.error('Update Driver Error:', (error as Error).message);
    return sendError(res, 500, 'Server error updating driver record', [(error as Error).message]);
  }
};

/**
 * @route   DELETE /api/v1/drivers/:id
 * @desc    Delete a driver record
 * @access  Private (Fleet Manager only)
 */
export const deleteDriver = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid driver ID format');
    }

    const driver = await Driver.findById(id);
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    // Business Rule: Delete only if Status is Available or Off Duty
    if (driver.status !== 'Available' && driver.status !== 'Off Duty') {
      return sendError(
        res,
        400,
        `Business Restriction: Cannot delete driver when status is '${driver.status}'. Deletion is allowed only if status is 'Available' or 'Off Duty'.`
      );
    }

    // Check if currently assigned to active trip (just in case status doesn't match trip data)
    const activeTrip = await Trip.findOne({ driver: id, status: 'Dispatched' });
    if (activeTrip) {
      return sendError(res, 400, "Business Restriction: Cannot delete driver while they are assigned to an active Trip");
    }

    await Driver.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Driver deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete Driver Error:', (error as Error).message);
    return sendError(res, 500, 'Server error deleting driver record', [(error as Error).message]);
  }
};

/**
 * @route   PATCH /api/v1/drivers/:id/status
 * @desc    Update driver duty status
 * @access  Private (Fleet Manager & Safety Officer)
 */
export const updateDriverStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid driver ID format');
    }

    if (!status) {
      return sendError(res, 400, 'Status field is required');
    }

    const validStatuses = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, `Invalid status value. Must be one of: ${validStatuses.join(', ')}`);
    }

    const driver = await Driver.findById(id);
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    // Business Rule: Expired License -> Driver cannot become Available
    const today = new Date();
    if (status === 'Available' && new Date(driver.licenseExpiry) <= today) {
      return sendError(res, 400, "Business Restriction: Driver with an expired license cannot become 'Available'");
    }

    // Business Rule: Driver on Trip -> Cannot change status manually while assigned to active Trip
    const activeTrip = await Trip.findOne({ driver: id, status: 'Dispatched' });
    if (activeTrip && status !== driver.status) {
      return sendError(res, 400, "Business Restriction: Cannot change status manually while driver is assigned to an active Trip");
    }

    driver.status = status;
    await driver.save();

    return res.status(200).json({
      success: true,
      message: 'Driver status updated successfully',
      data: driver,
    });
  } catch (error) {
    console.error('Update Driver Status Error:', (error as Error).message);
    return sendError(res, 500, 'Server error updating driver status', [(error as Error).message]);
  }
};

/**
 * @route   PATCH /api/v1/drivers/:id/safety-score
 * @desc    Update driver safety score
 * @access  Private (Fleet Manager & Safety Officer)
 */
export const updateDriverSafetyScore = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { safetyScore } = req.body;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid driver ID format');
    }

    if (safetyScore === undefined) {
      return sendError(res, 400, 'Safety score value is required');
    }

    const score = Number(safetyScore);
    if (isNaN(score) || score < 0 || score > 100) {
      return sendError(res, 400, 'Safety score must be a number between 0 and 100');
    }

    const driver = await Driver.findById(id);
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    driver.safetyScore = score;
    await driver.save();

    return res.status(200).json({
      success: true,
      message: 'Driver safety score updated successfully',
      data: driver,
    });
  } catch (error) {
    console.error('Update Driver Safety Score Error:', (error as Error).message);
    return sendError(res, 500, 'Server error updating driver safety score', [(error as Error).message]);
  }
};
