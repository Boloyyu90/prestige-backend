import express from 'express';
import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import v1 from './routes/v1';

const logger = pino({ transport: { target: 'pino-pretty' } });
const app = express();

const corsOptions: CorsOptions = {
    origin: true, // ganti whitelist kalau perlu
    credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(pinoHttp({ logger }));

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.use('/v1', v1);

// error fallback
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: any, res: any, _next: any) => {
    logger.error(err);
    res.status(err.statusCode ?? 500).json({ message: err.message ?? 'Internal error' });
});

export default app;
