import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { uploadsDir } from './middlewares/upload.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Profile images (PATCH /api/users/profile/image stores files here).
app.use('/uploads', express.static(uploadsDir));

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Blog Management REST API. See /api for the endpoint list.',
    });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
