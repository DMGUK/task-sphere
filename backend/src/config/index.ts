import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // Email
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'TaskSphere <onboarding@resend.dev>',
  },
  
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  
  // Tokens
  verificationTokenExpiry: parseInt(
    process.env.VERIFICATION_TOKEN_EXPIRY || '86400000'
  ), // 24 hours
};