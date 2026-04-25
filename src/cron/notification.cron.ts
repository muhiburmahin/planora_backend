import cron from 'node-cron';
import { NotificationService } from '../app/module/notification/notification.service';
export const initNotificationCron = () => {
    cron.schedule('0 0 * * 0', async () => {
        console.log('--- Cron Job Started: Cleaning Old Notifications ---');
        try {
            const result = await NotificationService.deleteOldNotifications();
            console.log(`Cleanup Success. Removed: ${result.removedCount} old notifications.`);
        } catch (error) {
            console.error('Cron Job Error:', error);
        }
    });
};