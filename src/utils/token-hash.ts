import crypto from 'crypto';
export const sha256hex = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
export const randomHex = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
