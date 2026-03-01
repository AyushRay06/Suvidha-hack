import { prisma } from '@suvidha/database';

export type JobType = 'GENERATE_BILLS' | 'SEND_NOTIFICATIONS' | 'PROCESS_METER_READINGS';

export interface JobPayload {
    [key: string]: any;
}

export class JobQueueService {
    /**
     * Create a new background job
     */
    static async createJob(type: JobType, payload?: JobPayload, scheduledAt?: Date) {
        return prisma.job.create({
            data: {
                type,
                payload: payload || {},
                scheduledAt: scheduledAt || new Date(),
            },
        });
    }

    /**
     * Get next pending job to process
     */
    static async getNextJob() {
        const job = await prisma.job.findFirst({
            where: {
                status: 'PENDING',
                scheduledAt: { lte: new Date() },
            },
            orderBy: { scheduledAt: 'asc' },
        });

        if (job) {
            // Skip if max attempts exceeded
            if (job.attempts >= job.maxAttempts) {
                return null;
            }

            // Mark as processing
            await prisma.job.update({
                where: { id: job.id },
                data: {
                    status: 'PROCESSING',
                    startedAt: new Date(),
                    attempts: { increment: 1 },
                },
            });
        }

        return job;
    }

    /**
     * Mark job as completed
     */
    static async completeJob(jobId: string) {
        return prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });
    }

    /**
     * Mark job as failed
     */
    static async failJob(jobId: string, error: string) {
        const job = await prisma.job.findUnique({ where: { id: jobId } });

        if (!job) return;

        const status = job.attempts >= job.maxAttempts ? 'FAILED' : 'PENDING';

        return prisma.job.update({
            where: { id: jobId },
            data: {
                status,
                error,
                ...(status === 'FAILED' && { completedAt: new Date() }),
            },
        });
    }

    /**
     * Process jobs (to be called by a worker/cron)
     */
    static async processJobs(handler: (job: any) => Promise<void>) {
        const job = await this.getNextJob();

        if (!job) return null;

        try {
            await handler(job);
            await this.completeJob(job.id);
            return job;
        } catch (error: any) {
            await this.failJob(job.id, error.message);
            throw error;
        }
    }
}
