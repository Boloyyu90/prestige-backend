import jwt from 'jsonwebtoken';
import { config } from '../config/config';

type JwtIn = { sub: number; email: string; name: string; role: 'ADMIN'|'PARTICIPANT' };

export const signAccessToken = (payload: JwtIn) =>
    jwt.sign({ ...payload, type: 'ACCESS' }, config.jwt.secret, { expiresIn: `${config.jwt.accessExpirationMinutes}m` });
