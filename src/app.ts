import express, { Application } from 'express';
import cors from 'cors';
import globalErrorHandler from './app/middleware/globalErrorHandler';
import notFound from './app/middleware/notFound';
import { IndexRoutes } from './app/routes';

import cookieParser from 'cookie-parser';

const app: Application = express();

app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', IndexRoutes);

// Error Handlers
app.use(globalErrorHandler);
app.use(notFound);

export default app;