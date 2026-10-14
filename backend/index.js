import express from 'express';
import dotenv from 'dotenv';
import prisma from './lib/prisma.js';
import routes from './routes/index.js';
import calculatorRoutes from './routes/calculator.js';
import { errorHandler } from './middleware/errorHandler.js';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'API is running', endpoints: ['/health', '/api', '/api/users', '/api/calculator'] });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// Use routes
app.use('/api/users', routes);
app.use('/api/calculator', calculatorRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
