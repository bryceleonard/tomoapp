console.log('TEST LOG');
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import meditationRoutes from './routes/meditation';
import subscriptionRoutes from './routes/subscription';
import webhookRoutes from './routes/webhooks';

// Load environment variables
dotenv.config();

// Debug logging for Stripe configuration
console.log('=== Environment Variables ===');
console.log('Stripe Key present:', !!process.env.STRIPE_SECRET_KEY);
console.log('Stripe Key length:', process.env.STRIPE_SECRET_KEY?.length);
console.log('Stripe Premium Price ID present:', !!process.env.STRIPE_PREMIUM_PRICE_ID);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Register webhook route first!
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Then register JSON parser for all other routes
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`=== Incoming Request ===`);
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Routes
app.use('/api/meditation', meditationRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('=== Server Error ===');
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const serverPort = typeof port === 'string' ? parseInt(port, 10) : port;
app.listen(serverPort, '0.0.0.0', () => {
  console.log(`=== Server Starting ===`);
  console.log(`Server is running on port ${serverPort}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`OpenAI API Key present: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`Firebase Config present: ${!!process.env.FIREBASE_CONFIG}`);
  console.log(`Server accessible at: http://192.168.0.33:${serverPort}`);
});

export default app; 