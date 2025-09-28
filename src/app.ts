import express from 'express';
import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import pinoHttp from 'pino-http';
import compression from 'compression';
import httpStatus from 'http-status';
import { config } from './config/config';
import v1Routes from './routes/v1';
import { errorHandler } from './middlewares/error';

const app = express();

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// ⬅️ P0: CORS whitelist
const corsOptions: CorsOptions = {
    origin(origin, cb) {
        const list = config.cors.allowedOrigins;
        if (!origin || list.length === 0 || list.includes(origin)) {
            return cb(null, true);
        }
        return cb(new Error('Not allowed by CORS'));
    },
    credentials: config.cors.allowCredentials,
};
app.use(cors(corsOptions));

app.use(
    pinoHttp({
        redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
        customSuccessMessage() {
            return 'request completed';
        },
    }),
);

app.get('/healthz', (_req, res) => res.status(httpStatus.OK).json({ status: 'ok' }));

app.use('/v1', v1Routes);

// global error handler
app.use(errorHandler);

export default app;
