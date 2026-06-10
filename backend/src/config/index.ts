import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // Email
  email: {
    host: process.env.EMAIL_HOST || 'localhost',
    port: parseInt(process.env.EMAIL_PORT || '1025'),
    secure: false, // true for 465, false for other ports
    from: process.env.EMAIL_FROM || 'TaskSphere <noreply@tasksphere.com>',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  },
  
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  
  // Tokens
  verificationTokenExpiry: parseInt(
    process.env.VERIFICATION_TOKEN_EXPIRY || '86400000'
  ), // 24 hours
};