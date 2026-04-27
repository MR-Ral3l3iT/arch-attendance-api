import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async sendPushNotification(
    _fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    // TODO: ใช้ firebase-admin ส่ง push notification จริง
    this.logger.log(`[Push] ${title}: ${body}`, data);
    return { sent: true };
  }

  async saveNotification(userId: string, title: string, body: string, data?: Record<string, unknown>) {
    return this.prisma.notification.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { userId, title, body, data: (data ?? {}) as any },
    });
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  // ── Cron: แจ้งเตือนก่อนคาบเรียน 15 นาที ─────────────────────────────────
  @Cron(CronExpression.EVERY_5_MINUTES)
  async notifyUpcomingClass() {
    const now = new Date();
    const inMinutes = new Date(now.getTime() + 15 * 60 * 1000);
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const targetTime = `${String(inMinutes.getHours()).padStart(2, '0')}:${String(inMinutes.getMinutes()).padStart(2, '0')}`;

    const dayMap: Record<number, string> = {
      0: 'SUNDAY', 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY',
      4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY',
    };
    const today = dayMap[now.getDay()];

    const schedules = await this.prisma.schedule.findMany({
      where: { dayOfWeek: today as never, startTime: targetTime },
      include: {
        section: { include: { enrollments: { include: { student: { include: { user: true } } } } } },
      },
    });

    for (const schedule of schedules) {
      for (const enrollment of schedule.section.enrollments) {
        await this.saveNotification(
          enrollment.student.userId,
          '⏰ ใกล้ถึงเวลาเรียน',
          `คาบเรียนของคุณจะเริ่มในอีก 15 นาที`,
          { scheduleId: schedule.id },
        );
      }
    }
  }
}
