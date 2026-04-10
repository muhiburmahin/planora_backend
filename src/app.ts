import express, { Application } from 'express';
import cors from 'cors';
import globalErrorHandler from './app/middleware/globalErrorHandler';
import notFound from './app/middleware/notFound';
import { IndexRoutes } from './app/routes';
import { auth } from './app/lib/auth';
import { toNodeHandler } from 'better-auth/node';
import cookieParser from 'cookie-parser';


const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.all("/api/v1/auth/", toNodeHandler(auth));

// API Routes
app.use('/api/v1', IndexRoutes);

// Error Handlers
app.use(globalErrorHandler);
app.use(notFound);

export default app;