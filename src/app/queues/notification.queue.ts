// import { Job, Queue, Worker } from 'bullmq';
// import { sendEmail } from '../utils/sendEmail';

// const redisConnection = {
//     host: 'localhost',
//     port: 6379
// };

// export const notificationQueue = new Queue('notificationQueue', {
//     connection: redisConnection
// });

// const worker = new Worker(
//     'notificationQueue',
//     async (job: Job) => {
//         const { email, subject, message } = job.data;

//         try {
//             await sendEmail(email, subject, message);
//         } catch (error) {
//             console.error(`Failed to send email to ${email}:`, error);
//             throw error;
//         }
//     },
//     {
//         connection: redisConnection,
//     }
// );

// worker.on('completed', (job) => {
//     console.log(`Notification job ${job.id} completed successfully`);
// });

// worker.on('failed', (job, err) => {
//     console.error(`Notification job ${job?.id} failed: ${err.message}`);
// });