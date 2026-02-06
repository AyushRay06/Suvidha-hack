import { JobQueueService } from '../modules/electricity/job-queue.service';
import { BillGeneratorService } from '../modules/electricity/bill-generator.service';

const POLL_INTERVAL = 5000; // 5 seconds
let isRunning = true;

async function processJob(job: any) {
    console.log(`📋 Processing job: ${job.type} (ID: ${job.id})`);

    switch (job.type) {
        case 'GENERATE_BILLS':
            if (job.payload.meterReadingId) {
                // Generate bill for specific meter reading
                const result = await BillGeneratorService.generateBillFromReading(
                    job.payload.meterReadingId
                );
                console.log(`✅ Bill generated: ${result.bill.billNo} for ₹${result.bill.totalAmount}`);
            } else if (job.payload.connectionId) {
                // Generate bills for connection
                console.log(`⚡ Generating bills for connection: ${job.payload.connectionId}`);
                // Could implement connection-specific bill generation here
            } else {
                // Generate all pending bills
                const results = await BillGeneratorService.generatePendingBills();
                console.log(`✅ Generated ${results.filter(r => r.success).length} bills`);
            }
            break;

        default:
            console.warn(`⚠️  Unknown job type: ${job.type}`);
    }
}

async function pollJobs() {
    while (isRunning) {
        try {
            const processed = await JobQueueService.processJobs(processJob);

            if (processed) {
                console.log(`✅ Job completed: ${processed.id}`);
            } else {
                // No jobs available, wait before polling again
                await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            }
        } catch (error: any) {
            console.error(`❌ Job processing error:`, error.message);
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        }
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down worker...');
    isRunning = false;
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down worker...');
    isRunning = false;
    process.exit(0);
});

// Start worker
console.log('🚀 Electricity Worker started');
console.log(`⏱️  Polling interval: ${POLL_INTERVAL}ms`);
console.log('Press Ctrl+C to stop\n');

pollJobs().catch((error) => {
    console.error('💥 Worker crashed:', error);
    process.exit(1);
});
