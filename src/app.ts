import express, { Application } from 'express';
import cors from 'cors';
import globalErrorHandler from './app/middleware/globalErrorHandler';
import notFound from './app/middleware/notFound';
import { IndexRoutes } from './app/routes';


const app: Application = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1', IndexRoutes);

// Error Handlers
app.use(globalErrorHandler);
app.use(notFound);

export default app;