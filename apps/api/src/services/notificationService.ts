import cron from 'node-cron';
import { getUpcomingReminders } from './eventService';

interface ReminderNotification {
  eventId: string;
  petId: string;
  title: string;
  scheduledAt: Date;
  remindAt: Date | null;
}

type NotificationHandler = (notification: ReminderNotification) => void | Promise<void>;

const handlers: NotificationHandler[] = [];

export function onReminder(handler: NotificationHandler): void {
  handlers.push(handler);
}

async function checkReminders(): Promise<void> {
  try {
    const events = await getUpcomingReminders();

    for (const event of events) {
      const notification: ReminderNotification = {
        eventId: event.id,
        petId: event.petId,
        title: event.title,
        scheduledAt: event.scheduledAt,
        remindAt: event.remindAt,
      };

      for (const handler of handlers) {
        await handler(notification);
      }
    }
  } catch (error) {
    console.error('[NotificationService] Error checking reminders:', error);
  }
}

export function startNotificationScheduler(): void {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    void checkReminders();
  });

  console.log('[NotificationService] Reminder scheduler started (every 5 minutes)');
}
