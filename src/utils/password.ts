import bcrypt from 'bcryptjs';
export const hashPassword = async (plain: string) => bcrypt.hash(plain, 10);
export const comparePassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
