import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import Document from '../models/Document';
import Vehicle from '../models/Vehicle';
import Driver from '../models/Driver';
import auditService from '../services/auditService';
import mongoose from 'mongoose';

/**
 * Helper to format error responses
 */
const sendError = (res: Response, statusCode: number, message: string) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * @route   GET /api/v1/documents
 * @desc    Get all documents, optionally filtered by entity
 * @access  Private (All Roles)
 */
export const getDocuments = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { entityId, entityType, type } = req.query;
    const query: any = {};

    if (entityId) {
      if (!mongoose.Types.ObjectId.isValid(String(entityId))) {
        return sendError(res, 400, 'Invalid entity ID format');
      }
      query.entityId = entityId;
    }
    if (entityType) query.entityType = entityType;
    if (type) query.type = type;

    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Documents list retrieved successfully',
      data: documents,
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};

/**
 * @route   POST /api/v1/documents
 * @desc    Upload new document metadata & payload
 * @access  Private (Fleet Manager & Safety Officer)
 */
export const uploadDocument = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, type, entityId, entityType, expiryDate, fileUrl, fileName, fileSize } = req.body;

    // Check required
    if (!name || !type || !entityId || !entityType || !fileUrl || !fileName || !fileSize) {
      return sendError(res, 400, 'Please provide all required document metadata fields');
    }

    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return sendError(res, 400, 'Invalid associated entity ID format');
    }

    // Verify entity exists
    let entityName = '';
    if (entityType === 'Vehicle') {
      const veh = await Vehicle.findById(entityId);
      if (!veh) return sendError(res, 404, 'Associated Vehicle file not found');
      entityName = veh.registrationNumber;
    } else if (entityType === 'Driver') {
      const drv = await Driver.findById(entityId);
      if (!drv) return sendError(res, 404, 'Associated Driver file not found');
      entityName = drv.fullName;
    } else {
      return sendError(res, 400, 'Invalid entity type association');
    }

    // Create document
    const doc = await Document.create({
      name,
      type,
      entityId,
      entityType,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      fileUrl,
      fileName,
      fileSize,
      createdBy: req.user!._id,
    });

    // Log Audit action
    await auditService.log({
      user: req.user!._id,
      module: 'Documents',
      action: 'Create',
      entityId: doc._id.toString(),
      entityName: `${name} (${entityName})`,
      afterValue: { name, type, entityId, entityType, expiryDate, fileName, fileSize },
    });

    return res.status(201).json({
      success: true,
      message: 'Document metadata uploaded successfully',
      data: doc,
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};

/**
 * @route   DELETE /api/v1/documents/:id
 * @desc    Remove document registry file
 * @access  Private (Fleet Manager & Safety Officer)
 */
export const deleteDocument = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid document ID format');
    }

    const doc = await Document.findById(id);
    if (!doc) {
      return sendError(res, 404, 'Document record not found');
    }

    await doc.deleteOne();

    // Log Audit action
    await auditService.log({
      user: req.user!._id,
      module: 'Documents',
      action: 'Delete',
      entityId: doc._id.toString(),
      entityName: doc.name,
      beforeValue: doc.toObject(),
    });

    return res.status(200).json({
      success: true,
      message: 'Document removed from system registry successfully',
    });
  } catch (error) {
    return sendError(res, 500, (error as Error).message);
  }
};
