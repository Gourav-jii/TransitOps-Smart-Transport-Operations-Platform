import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TransitOps - Smart Transport Operations Platform API',
      version: '1.0.0',
      description:
        'Enterprise-grade REST APIs for vehicle management, driver tracking, automated dispatch routing, and compliance scanning.',
      contact: {
        name: 'TransitOps DevOps & Support',
        email: 'devops@transitops.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token to access protected operational endpoints.',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: {
              type: 'string',
              enum: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'],
            },
            isActive: { type: 'boolean' },
            avatar: { type: 'string' },
            lastLogin: { type: 'string', format: 'date-time' },
          },
        },
        Vehicle: {
          type: 'object',
          required: ['registrationNumber', 'vehicleName', 'model', 'manufacturer', 'vehicleType', 'currentOdometer'],
          properties: {
            _id: { type: 'string' },
            registrationNumber: { type: 'string' },
            vehicleName: { type: 'string' },
            model: { type: 'string' },
            manufacturer: { type: 'string' },
            vehicleType: { type: 'string' },
            region: { type: 'string' },
            maximumLoadCapacity: { type: 'number' },
            currentOdometer: { type: 'number' },
            acquisitionCost: { type: 'number' },
            status: { type: 'string', enum: ['Available', 'On Trip', 'In Shop', 'Retired'] },
            fuelType: { type: 'string' },
            insuranceExpiry: { type: 'string', format: 'date-time' },
            fitnessExpiry: { type: 'string', format: 'date-time' },
            pollutionExpiry: { type: 'string', format: 'date-time' },
          },
        },
        Driver: {
          type: 'object',
          required: ['fullName', 'licenseNumber', 'licenseCategory', 'licenseExpiry', 'contactNumber'],
          properties: {
            _id: { type: 'string' },
            employeeId: { type: 'string' },
            fullName: { type: 'string' },
            licenseNumber: { type: 'string' },
            licenseCategory: { type: 'string' },
            licenseExpiry: { type: 'string', format: 'date-time' },
            contactNumber: { type: 'string' },
            email: { type: 'string' },
            safetyScore: { type: 'number' },
            status: { type: 'string', enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'] },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Document paths configuration
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJSDoc(options);
