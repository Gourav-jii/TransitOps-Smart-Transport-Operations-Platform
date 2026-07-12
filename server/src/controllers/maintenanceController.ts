import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/authMiddleware';
import MaintenanceLog, { IMaintenanceLog, MaintenanceStatus, MaintenanceType, MaintenancePriority } from '../models/MaintenanceLog';
import Vehicle from '../models/Vehicle';
import notificationService from '../services/notificationService';

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
 * @route   POST /api/v1/maintenance
 * @desc    Create a new maintenance log (Scheduled or Active)
 * @access  Private (Fleet Manager only)
 */
export const createMaintenance = async (req: AuthRequest, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  try {
    const {
      vehicleId,
      maintenanceType,
      title,
      description,
      vendor,
      technician,
      estimatedCost,
      scheduledDate,
      priority,
      status,
      remarks,
    } = req.body;

    // 1. Validations
    if (!vehicleId || !maintenanceType || !title || !description || !vendor || estimatedCost === undefined) {
      return sendError(res, 400, 'Missing required fields: vehicleId, maintenanceType, title, description, vendor, estimatedCost');
    }

    if (Number(estimatedCost) < 0) {
      return sendError(res, 400, 'Estimated cost cannot be negative');
    }

    if (!isValidObjectId(vehicleId)) {
      return sendError(res, 400, 'Invalid vehicle ID format');
    }

    // Start Transaction
    session.startTransaction();

    const vehicle = await Vehicle.findById(vehicleId).session(session);
    if (!vehicle) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 404, 'Vehicle not found');
    }

    // Rule 5: Retired vehicle cannot receive new maintenance
    if (vehicle.status === 'Retired') {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, 'Cannot create maintenance records for a Retired vehicle');
    }

    const targetStatus: MaintenanceStatus = status || 'Scheduled';

    // Business checks if creating an active maintenance directly
    if (targetStatus === 'Active') {
      // Rule 1: A vehicle already On Trip cannot start maintenance
      if (vehicle.status === 'On Trip') {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, 400, 'Vehicle is currently On Trip and cannot start maintenance');
      }

      // Rule 6: Only one Active maintenance per vehicle
      const existingActive = await MaintenanceLog.findOne({
        vehicle: vehicleId,
        status: 'Active',
      }).session(session);

      if (existingActive) {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, 400, 'Vehicle already has an Active maintenance log');
      }

      // Rule 2: Automatically change vehicle status Available -> In Shop
      if (vehicle.status === 'Available') {
        vehicle.status = 'In Shop';
        await vehicle.save({ session });
      }
    }

    if (!req.user) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 401, 'Unauthorized session');
    }

    const startDate = targetStatus === 'Active' ? new Date() : undefined;

    // Create Maintenance Log
    const newLog = new MaintenanceLog({
      vehicle: vehicleId,
      maintenanceType,
      title,
      description,
      vendor,
      technician,
      estimatedCost,
      scheduledDate,
      startDate,
      priority: priority || 'Medium',
      status: targetStatus,
      remarks,
      createdBy: req.user._id,
      auditHistory: [
        {
          user: req.user._id,
          action: 'Created',
          timestamp: new Date(),
          newStatus: targetStatus,
        },
      ],
    });

    await newLog.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Trigger Notification for Active Maintenance
    if (targetStatus === 'Active') {
      await notificationService.createNotification({
        title: 'Maintenance Started',
        message: `Active maintenance ${newLog.maintenanceId} (${newLog.maintenanceType}) started for vehicle ${vehicle.registrationNumber}.`,
        type: 'Maintenance Started',
        vehicleId: vehicle._id,
        maintenanceId: newLog._id,
      });
    }

    // Populate and return
    const populatedLog = await MaintenanceLog.findById(newLog._id)
      .populate('vehicle', 'registrationNumber vehicleName status')
      .populate('createdBy', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Maintenance log created successfully',
      data: populatedLog,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    // Handle transaction fallback if database runs standalone (e.g. Docker dev fallback)
    if (error.message && error.message.includes('Replica Set')) {
      console.warn('[Transaction Fallback] Mongo standalone detected. Re-running create sequentially...');
      return await createMaintenanceFallback(req, res);
    }

    return sendError(res, 500, error.message);
  }
};

/**
 * Sequential Fallback for createMaintenance (without Mongoose transaction sessions)
 */
const createMaintenanceFallback = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      vehicleId,
      maintenanceType,
      title,
      description,
      vendor,
      technician,
      estimatedCost,
      scheduledDate,
      priority,
      status,
      remarks,
    } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return sendError(res, 404, 'Vehicle not found');

    if (vehicle.status === 'Retired') {
      return sendError(res, 400, 'Cannot create maintenance records for a Retired vehicle');
    }

    const targetStatus: MaintenanceStatus = status || 'Scheduled';

    if (targetStatus === 'Active') {
      if (vehicle.status === 'On Trip') {
        return sendError(res, 400, 'Vehicle is currently On Trip and cannot start maintenance');
      }

      const existingActive = await MaintenanceLog.findOne({ vehicle: vehicleId, status: 'Active' });
      if (existingActive) {
        return sendError(res, 400, 'Vehicle already has an Active maintenance log');
      }

      if (vehicle.status === 'Available') {
        vehicle.status = 'In Shop';
        await vehicle.save();
      }
    }

    const newLog = await MaintenanceLog.create({
      vehicle: vehicleId,
      maintenanceType,
      title,
      description,
      vendor,
      technician,
      estimatedCost,
      scheduledDate,
      startDate: targetStatus === 'Active' ? new Date() : undefined,
      priority: priority || 'Medium',
      status: targetStatus,
      remarks,
      createdBy: req.user!._id,
      auditHistory: [
        {
          user: req.user!._id,
          action: 'Created',
          timestamp: new Date(),
          newStatus: targetStatus,
        },
      ],
    });

    if (targetStatus === 'Active') {
      await notificationService.createNotification({
        title: 'Maintenance Started',
        message: `Active maintenance ${newLog.maintenanceId} (${newLog.maintenanceType}) started for vehicle ${vehicle.registrationNumber}.`,
        type: 'Maintenance Started',
        vehicleId: vehicle._id,
        maintenanceId: newLog._id,
      });
    }

    const populatedLog = await MaintenanceLog.findById(newLog._id)
      .populate('vehicle', 'registrationNumber vehicleName status')
      .populate('createdBy', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Maintenance log created successfully (Fallback Mode)',
      data: populatedLog,
    });
  } catch (err: any) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   GET /api/v1/maintenance
 * @desc    Fetch list of maintenance records with search, filtering, and pagination
 * @access  Private (All authenticated roles)
 */
export const getMaintenanceLogs = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      maintenanceType,
      vehicleId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skipNum = (pageNum - 1) * limitNum;

    const query: any = {};

    // Filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (maintenanceType) query.maintenanceType = maintenanceType;
    if (vehicleId && isValidObjectId(vehicleId as string)) query.vehicle = vehicleId;

    // Date Range Filters on Scheduled Date
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate as string);
      if (endDate) query.scheduledDate.$lte = new Date(endDate as string);
    }

    // Search matches maintenanceId, vendor, invoiceNumber, or vehicle registration number
    if (search) {
      const matchingVehicles = await Vehicle.find({
        registrationNumber: { $regex: search as string, $options: 'i' },
      }).select('_id');
      const vehicleIds = matchingVehicles.map((v) => v._id);

      query.$or = [
        { maintenanceId: { $regex: search as string, $options: 'i' } },
        { vendor: { $regex: search as string, $options: 'i' } },
        { invoiceNumber: { $regex: search as string, $options: 'i' } },
        { vehicle: { $in: vehicleIds } },
      ];
    }

    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const logs = await MaintenanceLog.find(query)
      .sort(sortConfig)
      .skip(skipNum)
      .limit(limitNum)
      .populate('vehicle', 'registrationNumber vehicleName status manufacturer model')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');

    const total = await MaintenanceLog.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Maintenance logs retrieved successfully',
      data: {
        maintenanceLogs: logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};

/**
 * @route   GET /api/v1/maintenance/:id
 * @desc    Fetch detailed maintenance log by ID
 * @access  Private (All authenticated roles)
 */
export const getMaintenanceLogById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid maintenance log ID format');
    }

    const log = await MaintenanceLog.findById(id)
      .populate('vehicle')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role')
      .populate('auditHistory.user', 'name email role');

    if (!log) {
      return sendError(res, 404, 'Maintenance log file not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Maintenance log file fetched successfully',
      data: log,
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};

/**
 * @route   PUT /api/v1/maintenance/:id
 * @desc    Update maintenance log details (excluding status transitions)
 * @access  Private (Fleet Manager only)
 */
export const updateMaintenanceLog = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      maintenanceType,
      title,
      description,
      vendor,
      technician,
      estimatedCost,
      actualCost,
      scheduledDate,
      priority,
      invoiceNumber,
      remarks,
    } = req.body;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid maintenance log ID format');
    }

    const log = await MaintenanceLog.findById(id);
    if (!log) {
      return sendError(res, 404, 'Maintenance log not found');
    }

    // Verify Vehicle is not Retired
    const vehicle = await Vehicle.findById(log.vehicle);
    if (vehicle && vehicle.status === 'Retired') {
      return sendError(res, 400, 'Cannot modify maintenance details for a Retired vehicle');
    }

    if (estimatedCost !== undefined && Number(estimatedCost) < 0) {
      return sendError(res, 400, 'Estimated cost cannot be negative');
    }
    if (actualCost !== undefined && Number(actualCost) < 0) {
      return sendError(res, 400, 'Actual cost cannot be negative');
    }

    // Save fields
    if (maintenanceType) log.maintenanceType = maintenanceType;
    if (title) log.title = title;
    if (description) log.description = description;
    if (vendor) log.vendor = vendor;
    if (technician !== undefined) log.technician = technician;
    if (estimatedCost !== undefined) log.estimatedCost = estimatedCost;
    if (actualCost !== undefined) log.actualCost = actualCost;
    if (scheduledDate !== undefined) log.scheduledDate = scheduledDate;
    if (priority) log.priority = priority;
    if (invoiceNumber !== undefined) log.invoiceNumber = invoiceNumber;
    if (remarks !== undefined) log.remarks = remarks;

    if (!req.user) {
      return sendError(res, 401, 'Unauthorized request');
    }

    log.updatedBy = req.user._id;

    // Track Audit Log
    log.auditHistory.push({
      user: req.user._id,
      action: 'Updated',
      timestamp: new Date(),
      prevStatus: log.status,
      newStatus: log.status,
    });

    await log.save();

    const populatedLog = await MaintenanceLog.findById(log._id)
      .populate('vehicle', 'registrationNumber vehicleName status')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Maintenance details updated successfully',
      data: populatedLog,
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};

/**
 * @route   DELETE /api/v1/maintenance/:id
 * @desc    Delete maintenance log
 * @access  Private (Fleet Manager only)
 */
export const deleteMaintenanceLog = async (req: AuthRequest, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid log ID format');
    }

    session.startTransaction();

    const log = await MaintenanceLog.findById(id).session(session);
    if (!log) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 404, 'Maintenance log file not found');
    }

    // Revert Vehicle Status In Shop -> Available if active log is deleted
    if (log.status === 'Active') {
      const vehicle = await Vehicle.findById(log.vehicle).session(session);
      if (vehicle && vehicle.status === 'In Shop') {
        vehicle.status = 'Available';
        await vehicle.save({ session });
      }
    }

    await MaintenanceLog.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: 'Maintenance record deleted successfully',
      data: { id },
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    if (error.message && error.message.includes('Replica Set')) {
      console.warn('[Transaction Fallback] Standalone Mongo. Re-running delete sequentially...');
      return await deleteMaintenanceFallback(req, res);
    }
    return sendError(res, 500, error.message);
  }
};

/**
 * Sequential Fallback for deleteMaintenanceLog
 */
const deleteMaintenanceFallback = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const log = await MaintenanceLog.findById(id);
    if (!log) return sendError(res, 404, 'Maintenance log not found');

    if (log.status === 'Active') {
      const vehicle = await Vehicle.findById(log.vehicle);
      if (vehicle && vehicle.status === 'In Shop') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
    }

    await MaintenanceLog.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Maintenance record deleted successfully (Fallback Mode)',
      data: { id },
    });
  } catch (err: any) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   PATCH /api/v1/maintenance/:id/start
 * @desc    Transition maintenance Scheduled -> Active
 * @access  Private (Fleet Manager only)
 */
export const startMaintenance = async (req: AuthRequest, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid log ID format');
    }

    session.startTransaction();

    const log = await MaintenanceLog.findById(id).session(session);
    if (!log) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 404, 'Maintenance log not found');
    }

    if (log.status !== 'Scheduled') {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, `Cannot start maintenance. Log is currently ${log.status}`);
    }

    const vehicle = await Vehicle.findById(log.vehicle).session(session);
    if (!vehicle) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 404, 'Vehicle not found');
    }

    // Rule 5: Retired vehicle check
    if (vehicle.status === 'Retired') {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, 'Cannot start maintenance for a Retired vehicle');
    }

    // Rule 1: Vehicle On Trip check
    if (vehicle.status === 'On Trip') {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, 'Vehicle is On Trip and cannot start maintenance');
    }

    // Rule 6: Check for another Active maintenance
    const existingActive = await MaintenanceLog.findOne({
      vehicle: log.vehicle,
      status: 'Active',
    }).session(session);

    if (existingActive) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, 'Vehicle already has an Active maintenance log underway');
    }

    // Update Statuses
    log.status = 'Active';
    log.startDate = new Date();
    log.updatedBy = req.user!._id;
    log.auditHistory.push({
      user: req.user!._id,
      action: 'Started',
      timestamp: new Date(),
      prevStatus: 'Scheduled',
      newStatus: 'Active',
    });

    // Rule 2: Update Vehicle Available -> In Shop
    if (vehicle.status === 'Available') {
      vehicle.status = 'In Shop';
      await vehicle.save({ session });
    }

    await log.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Trigger Notification
    await notificationService.createNotification({
      title: 'Maintenance Started',
      message: `Active maintenance ${log.maintenanceId} (${log.maintenanceType}) started for vehicle ${vehicle.registrationNumber}.`,
      type: 'Maintenance Started',
      vehicleId: vehicle._id,
      maintenanceId: log._id,
    });

    const populatedLog = await MaintenanceLog.findById(log._id)
      .populate('vehicle', 'registrationNumber vehicleName status')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Maintenance started successfully',
      data: populatedLog,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    if (error.message && error.message.includes('Replica Set')) {
      console.warn('[Transaction Fallback] Standalone Mongo. Re-running start sequentially...');
      return await startMaintenanceFallback(req, res);
    }
    return sendError(res, 500, error.message);
  }
};

/**
 * Sequential Fallback for startMaintenance
 */
const startMaintenanceFallback = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const log = await MaintenanceLog.findById(id);
    if (!log) return sendError(res, 404, 'Maintenance log not found');

    if (log.status !== 'Scheduled') {
      return sendError(res, 400, `Cannot start maintenance. Log is currently ${log.status}`);
    }

    const vehicle = await Vehicle.findById(log.vehicle);
    if (!vehicle) return sendError(res, 404, 'Vehicle not found');

    if (vehicle.status === 'Retired') {
      return sendError(res, 400, 'Cannot start maintenance for a Retired vehicle');
    }
    if (vehicle.status === 'On Trip') {
      return sendError(res, 400, 'Vehicle is On Trip and cannot start maintenance');
    }

    const existingActive = await MaintenanceLog.findOne({ vehicle: log.vehicle, status: 'Active' });
    if (existingActive) {
      return sendError(res, 400, 'Vehicle already has an Active maintenance log underway');
    }

    log.status = 'Active';
    log.startDate = new Date();
    log.updatedBy = req.user!._id;
    log.auditHistory.push({
      user: req.user!._id,
      action: 'Started',
      timestamp: new Date(),
      prevStatus: 'Scheduled',
      newStatus: 'Active',
    });

    if (vehicle.status === 'Available') {
      vehicle.status = 'In Shop';
      await vehicle.save();
    }

    await log.save();

    await notificationService.createNotification({
      title: 'Maintenance Started',
      message: `Active maintenance ${log.maintenanceId} (${log.maintenanceType}) started for vehicle ${vehicle.registrationNumber}.`,
      type: 'Maintenance Started',
      vehicleId: vehicle._id,
      maintenanceId: log._id,
    });

    const populatedLog = await MaintenanceLog.findById(log._id)
      .populate('vehicle', 'registrationNumber vehicleName status')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Maintenance started successfully (Fallback Mode)',
      data: populatedLog,
    });
  } catch (err: any) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   PATCH /api/v1/maintenance/:id/complete
 * @desc    Transition maintenance Active -> Completed
 * @access  Private (Fleet Manager only)
 */
export const completeMaintenance = async (req: AuthRequest, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    const { actualCost, invoiceNumber, remarks } = req.body;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid log ID format');
    }

    if (actualCost === undefined) {
      return sendError(res, 400, 'Actual cost is required on completion');
    }
    if (Number(actualCost) < 0) {
      return sendError(res, 400, 'Actual cost cannot be negative');
    }

    session.startTransaction();

    const log = await MaintenanceLog.findById(id).session(session);
    if (!log) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 404, 'Maintenance log file not found');
    }

    if (log.status !== 'Active') {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, `Cannot complete maintenance. Log status is ${log.status}`);
    }

    const vehicle = await Vehicle.findById(log.vehicle).session(session);
    if (!vehicle) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 404, 'Vehicle not found');
    }

    // Complete Maintenance Log
    log.status = 'Completed';
    log.endDate = new Date();
    log.actualCost = actualCost;
    if (invoiceNumber) log.invoiceNumber = invoiceNumber;
    if (remarks) log.remarks = remarks;
    log.updatedBy = req.user!._id;
    log.auditHistory.push({
      user: req.user!._id,
      action: 'Completed',
      timestamp: new Date(),
      prevStatus: 'Active',
      newStatus: 'Completed',
    });

    // Rule 4: Revert Vehicle status In Shop -> Available (unless Retired)
    if (vehicle.status === 'In Shop') {
      vehicle.status = 'Available';
      await vehicle.save({ session });
    }

    await log.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Trigger Notification
    await notificationService.createNotification({
      title: 'Maintenance Completed',
      message: `Maintenance task ${log.maintenanceId} (${log.maintenanceType}) for vehicle ${vehicle.registrationNumber} completed successfully.`,
      type: 'Maintenance Completed',
      vehicleId: vehicle._id,
      maintenanceId: log._id,
    });

    const populatedLog = await MaintenanceLog.findById(log._id)
      .populate('vehicle', 'registrationNumber vehicleName status')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Maintenance completed successfully',
      data: populatedLog,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    if (error.message && error.message.includes('Replica Set')) {
      console.warn('[Transaction Fallback] Standalone Mongo. Re-running complete sequentially...');
      return await completeMaintenanceFallback(req, res);
    }
    return sendError(res, 500, error.message);
  }
};

/**
 * Sequential Fallback for completeMaintenance
 */
const completeMaintenanceFallback = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { actualCost, invoiceNumber, remarks } = req.body;

    const log = await MaintenanceLog.findById(id);
    if (!log) return sendError(res, 404, 'Maintenance log file not found');

    if (log.status !== 'Active') {
      return sendError(res, 400, `Cannot complete maintenance. Log status is ${log.status}`);
    }

    const vehicle = await Vehicle.findById(log.vehicle);
    if (!vehicle) return sendError(res, 404, 'Vehicle not found');

    log.status = 'Completed';
    log.endDate = new Date();
    log.actualCost = actualCost;
    if (invoiceNumber) log.invoiceNumber = invoiceNumber;
    if (remarks) log.remarks = remarks;
    log.updatedBy = req.user!._id;
    log.auditHistory.push({
      user: req.user!._id,
      action: 'Completed',
      timestamp: new Date(),
      prevStatus: 'Active',
      newStatus: 'Completed',
    });

    if (vehicle.status === 'In Shop') {
      vehicle.status = 'Available';
      await vehicle.save();
    }

    await log.save();

    await notificationService.createNotification({
      title: 'Maintenance Completed',
      message: `Maintenance task ${log.maintenanceId} (${log.maintenanceType}) for vehicle ${vehicle.registrationNumber} completed successfully.`,
      type: 'Maintenance Completed',
      vehicleId: vehicle._id,
      maintenanceId: log._id,
    });

    const populatedLog = await MaintenanceLog.findById(log._id)
      .populate('vehicle', 'registrationNumber vehicleName status')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Maintenance completed successfully (Fallback Mode)',
      data: populatedLog,
    });
  } catch (err: any) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @route   PATCH /api/v1/maintenance/:id/cancel
 * @desc    Transition maintenance Scheduled or Active -> Cancelled
 * @access  Private (Fleet Manager only)
 */
export const cancelMaintenance = async (req: AuthRequest, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'Invalid log ID format');
    }

    session.startTransaction();

    const log = await MaintenanceLog.findById(id).session(session);
    if (!log) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 404, 'Maintenance log file not found');
    }

    if (log.status === 'Completed' || log.status === 'Cancelled') {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 400, `Cannot cancel. Log is already ${log.status}`);
    }

    const prev = log.status;

    log.status = 'Cancelled';
    log.endDate = new Date();
    log.updatedBy = req.user!._id;
    log.auditHistory.push({
      user: req.user!._id,
      action: 'Cancelled',
      timestamp: new Date(),
      prevStatus: prev,
      newStatus: 'Cancelled',
    });

    // If active log was cancelled, revert Vehicle status In Shop -> Available
    if (prev === 'Active') {
      const vehicle = await Vehicle.findById(log.vehicle).session(session);
      if (vehicle && vehicle.status === 'In Shop') {
        vehicle.status = 'Available';
        await vehicle.save({ session });
      }
    }

    await log.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populatedLog = await MaintenanceLog.findById(log._id)
      .populate('vehicle', 'registrationNumber vehicleName status')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Maintenance cancelled successfully',
      data: populatedLog,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    if (error.message && error.message.includes('Replica Set')) {
      console.warn('[Transaction Fallback] Standalone Mongo. Re-running cancel sequentially...');
      return await cancelMaintenanceFallback(req, res);
    }
    return sendError(res, 500, error.message);
  }
};

/**
 * Sequential Fallback for cancelMaintenance
 */
const cancelMaintenanceFallback = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const log = await MaintenanceLog.findById(id);
    if (!log) return sendError(res, 404, 'Maintenance log file not found');

    if (log.status === 'Completed' || log.status === 'Cancelled') {
      return sendError(res, 400, `Cannot cancel. Log is already ${log.status}`);
    }

    const prev = log.status;

    log.status = 'Cancelled';
    log.endDate = new Date();
    log.updatedBy = req.user!._id;
    log.auditHistory.push({
      user: req.user!._id,
      action: 'Cancelled',
      timestamp: new Date(),
      prevStatus: prev,
      newStatus: 'Cancelled',
    });

    if (prev === 'Active') {
      const vehicle = await Vehicle.findById(log.vehicle);
      if (vehicle && vehicle.status === 'In Shop') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
    }

    await log.save();

    const populatedLog = await MaintenanceLog.findById(log._id)
      .populate('vehicle', 'registrationNumber vehicleName status')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Maintenance cancelled successfully (Fallback Mode)',
      data: populatedLog,
    });
  } catch (err: any) {
    return sendError(res, 500, err.message);
  }
};
