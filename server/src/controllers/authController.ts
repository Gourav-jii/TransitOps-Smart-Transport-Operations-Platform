import { Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';
import auditService from '../services/auditService';

/**
 * Generate a JWT token valid for 7 days
 */
const generateToken = (id: string): string => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'transitops-secret-key-2026',
    { expiresIn: '7d' }
  );
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, email, password, role, avatar } = req.body;

    // Validate inputs
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, role',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      avatar: avatar || '',
      isActive: true,
    });

    const token = generateToken(user._id.toString());

    // Remove password from response
    const userObj = user.toObject();
    delete (userObj as any).password;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userObj,
    });
  } catch (error) {
    console.error('Registration Error:', (error as Error).message);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || 'Server Error during registration',
    });
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
export const login = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Contact administrator.',
      });
    }

    // Check password match
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Log Audit action
    await auditService.log({
      user: user._id,
      module: 'Auth',
      action: 'Login',
      entityId: user._id.toString(),
      entityName: user.name,
    });

    const token = generateToken(user._id.toString());

    // Remove password from response
    const userObj = user.toObject();
    delete (userObj as any).password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userObj,
    });
  } catch (error) {
    console.error('Login Error:', (error as Error).message);
    return res.status(500).json({
      success: false,
      message: 'Server Error during login',
    });
  }
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('Profile Retrieval Error:', (error as Error).message);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving profile',
    });
  }
};

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Update password for current user
 * @access  Private
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both old and new passwords',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Get user with password included for comparison
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password',
      });
    }

    // Set new password (the pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password Update Error:', (error as Error).message);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating password',
    });
  }
};

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Log out user / destroy token
 * @access  Public
 */
export const logout = async (req: AuthRequest, res: Response): Promise<any> => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Clear client token context.',
  });
};

/**
 * @route   PUT /api/v1/auth/update-profile
 * @desc    Update name and avatar for current user
 * @access  Private
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, avatar } = req.body;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save({ validateBeforeSave: false });

    // Log Audit action
    await auditService.log({
      user: user._id,
      module: 'Auth',
      action: 'Update Profile',
      entityId: user._id.toString(),
      entityName: user.name,
    });

    const userObj = user.toObject();
    delete (userObj as any).password;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userObj,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: (error as Error).message || 'Server Error updating profile',
    });
  }
};
