import { Response } from 'express';
import mongoose from 'mongoose';
import Expense from '../models/Expense';
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
 * @route   POST /api/v1/expenses
 * @desc    Create a new expense record
 * @access  Private (Fleet Manager, Financial Analyst only)
 */
export const createExpense = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      vehicle,
      trip,
      expenseType,
      amount,
      expenseDate,
      vendor,
      description,
      receiptNumber,
      remarks,
    } = req.body;

    if (!expenseType || amount === undefined || !vendor || !description) {
      return sendError(res, 400, 'Required fields are missing: expenseType, amount, vendor, description');
    }

    if (Number(amount) < 0) {
      return sendError(res, 400, 'Expense amount cannot be negative');
    }

    // Validate vehicle if provided
    if (vehicle) {
      const vehicleDoc = await Vehicle.findById(vehicle);
      if (!vehicleDoc) {
        return sendError(res, 400, 'Assigned vehicle does not exist');
      }
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

    const expense = await Expense.create({
      vehicle: vehicle || undefined,
      trip: trip || undefined,
      expenseType,
      amount: Number(amount),
      expenseDate: expenseDate || new Date(),
      vendor,
      description,
      receiptNumber,
      remarks,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: expense,
    });
  } catch (error) {
    console.error('Create Expense Error:', (error as Error).message);
    return sendError(res, 500, 'Server error recording expense entry', [(error as Error).message]);
  }
};

/**
 * @route   GET /api/v1/expenses
 * @desc    Get expenses with search, sorting, filtering, and pagination
 * @access  Private (All Roles)
 */
export const getExpenses = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { search, vehicle, trip, expenseType, startDate, endDate, sortBy, sortOrder } = req.query;

    const query: any = {};

    // Filters
    if (vehicle) query.vehicle = vehicle;
    if (trip) query.trip = trip;
    if (expenseType) query.expenseType = expenseType;

    // Date range
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate as string);
      if (endDate) query.expenseDate.$lte = new Date(endDate as string);
    }

    // Search matches receiptNumber, vendor, description, or vehicle plate
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      const orConditions: any[] = [
        { receiptNumber: searchRegex },
        { vendor: searchRegex },
        { description: searchRegex },
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
    const allowedSortFields = ['expenseDate', 'amount', 'expenseType', 'createdAt'];
    const activeSortField = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : 'expenseDate';
    const activeSortOrder = sortOrder === 'asc' ? 1 : -1;
    sort[activeSortField] = activeSortOrder;

    const expenses = await Expense.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('vehicle')
      .populate('trip', 'tripNumber source destination')
      .populate('createdBy', 'name email role');

    const total = await Expense.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: 'Expenses fetched successfully',
      data: {
        expenses,
        pagination: {
          total,
          page,
          limit,
          pages,
        },
      },
    });
  } catch (error) {
    console.error('Fetch Expenses Error:', (error as Error).message);
    return sendError(res, 500, 'Server error fetching expenses', [(error as Error).message]);
  }
};

/**
 * @route   GET /api/v1/expenses/:id
 * @desc    Get single expense by ID
 * @access  Private (All Roles)
 */
export const getExpenseById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid expense ID format');
    }

    const expense = await Expense.findById(id)
      .populate('vehicle')
      .populate('trip', 'tripNumber source destination')
      .populate('createdBy', 'name email role');

    if (!expense) {
      return sendError(res, 404, 'Expense not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Expense details retrieved successfully',
      data: expense,
    });
  } catch (error) {
    console.error('Fetch Expense ID Error:', (error as Error).message);
    return sendError(res, 500, 'Server error retrieving expense details', [(error as Error).message]);
  }
};

/**
 * @route   PUT /api/v1/expenses/:id
 * @desc    Update an expense log
 * @access  Private (Fleet Manager, Financial Analyst only)
 */
export const updateExpense = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid expense ID format');
    }

    const { amount, vehicle, trip } = req.body;

    if (amount !== undefined && Number(amount) < 0) {
      return sendError(res, 400, 'Expense amount cannot be negative');
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

    const expense = await Expense.findById(id);
    if (!expense) {
      return sendError(res, 404, 'Expense not found');
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('vehicle')
      .populate('trip', 'tripNumber source destination')
      .populate('createdBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense,
    });
  } catch (error) {
    console.error('Update Expense Error:', (error as Error).message);
    return sendError(res, 500, 'Server error updating expense record', [(error as Error).message]);
  }
};

/**
 * @route   DELETE /api/v1/expenses/:id
 * @desc    Delete an expense log
 * @access  Private (Fleet Manager, Financial Analyst only)
 */
export const deleteExpense = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid expense ID format');
    }

    const expense = await Expense.findById(id);
    if (!expense) {
      return sendError(res, 404, 'Expense not found');
    }

    await Expense.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete Expense Error:', (error as Error).message);
    return sendError(res, 500, 'Server error deleting expense record', [(error as Error).message]);
  }
};
