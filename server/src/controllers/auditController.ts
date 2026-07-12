import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import AuditLog from '../models/AuditLog';

/**
 * @route   GET /api/v1/audit
 * @desc    Fetch paginated audit logs trail with filters
 * @access  Private (Fleet Manager & Safety Officer)
 */
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { user, module, action, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (user && user !== '') {
      query.user = user;
    }
    if (module && module !== '') {
      query.module = module;
    }
    if (action && action !== '') {
      query.action = action;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(String(startDate));
      if (endDate) query.timestamp.$lte = new Date(String(endDate));
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'name email role');

    const total = await AuditLog.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: {
        logs,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};
