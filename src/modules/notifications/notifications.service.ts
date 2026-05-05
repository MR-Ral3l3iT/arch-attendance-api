import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getMessaging } from 'firebase-admin/messaging';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ensureFirebaseAppInitialized } from '../../common/firebase/firebase-admin';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  private ensureFirebaseAppInitialized() {
    try {
      ensureFirebaseAppInitialized();
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error ? error.message : 'Firebase is not configured',
      );
    }
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    this.ensureFirebaseAppInitialized();
    try {
      const messageId = await getMessaging().send({
        token: fcmToken,
        notification: { title, body },
        data,
        android: { priority: 'high' },
        apns: {
          payload: {
            aps: { sound: 'default' },
          },
        },
      });
      this.logger.log(`[Push] Sent message ${messageId}`);
      return { sent: true, messageId };
    } catch (error) {
      this.logger.error('[Push] Failed to send notification', error);
      throw error;
    }
  }

  async saveNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
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

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async announceToSection(sectionId: string, title: string, body: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { sectionId },
      include: { student: { select: { userId: true, deviceInfo: true } } },
    });

    if (enrollments.length === 0) return { sent: 0 };

    await this.prisma.notification.createMany({
      data: enrollments.map((e) => ({
        userId: e.student.userId,
        title,
        body,
        data: { type: 'ANNOUNCEMENT', sectionId },
      })),
    });

    let pushSent = 0;
    for (const enrollment of enrollments) {
      const deviceInfo = (enrollment.student.deviceInfo ?? {}) as Record<string, unknown>;
      const fcmToken = typeof deviceInfo.fcmToken === 'string' ? deviceInfo.fcmToken : null;
      if (fcmToken == null || fcmToken.length === 0) {
        continue;
      }
      try {
        await this.sendPushNotification(
          fcmToken,
          title,
          body,
          { type: 'ANNOUNCEMENT', sectionId },
        );
        pushSent += 1;
      } catch (_) {
        // keep announcing others even if one token fails
      }
    }

    return { sent: enrollments.length, pushSent };
  }

  async registerFcmToken(userId: string, fcmToken: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true, deviceInfo: true },
    });

    if (student == null) {
      return { success: false, reason: 'student_not_found' };
    }

    const existing = (student.deviceInfo ?? {}) as Record<string, unknown>;
    const next: Record<string, unknown> = {
      ...existing,
      fcmToken,
      fcmTokenUpdatedAt: new Date().toISOString(),
    };

    await this.prisma.student.update({
      where: { id: student.id },
      data: { deviceInfo: next as Prisma.InputJsonValue },
    });

    return { success: true };
  }

  // ── Cron: แจ้งเตือนก่อนคาบเรียน 15 นาที ─────────────────────────────────
  @Cron(CronExpression.EVERY_5_MINUTES)
  async notifyUpcomingClass() {
    const now = new Date();
    const inMinutes = new Date(now.getTime() + 15 * 60 * 1000);
    const targetTime = `${String(inMinutes.getHours()).padStart(2, '0')}:${String(inMinutes.getMinutes()).padStart(2, '0')}`;

    const dayMap: Record<number, string> = {
      0: 'SUNDAY',
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
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
