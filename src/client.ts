type PrismaClientLike = {
    $transaction<T>(fn: (tx: PrismaClientLike) => Promise<T>): Promise<T>;
    $transaction<T>(operations: Array<Promise<T>>): Promise<T[]>;
    $disconnect(): Promise<void>;
    $connect(): Promise<void>;
    [key: string]: any;
};

type PrismaClientConstructor = new (...args: any[]) => PrismaClientLike;

const { PrismaClient }: { PrismaClient: PrismaClientConstructor } = require('@prisma/client');

const prisma: PrismaClientLike = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
});

export type PrismaClient = PrismaClientLike;
export default prisma;