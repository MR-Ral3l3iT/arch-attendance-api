import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertAttendanceSettingsDto } from './dto/settings.dto';

const DEFAULT_SETTINGS = {
  openBeforeMinutes: 15,
  closeAfterMinutes: 30,
  lateAfterMinutes: 15,
  absentAfterMinutes: 30,
};

@Injectable()
export class AttendanceSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(scheduleId: string) {
    const settings = await this.prisma.attendanceSettings.findUnique({
      where: { scheduleId },
      include: { schedule: { include: { section: { include: { course: true } } } } },
    });
    return settings ?? { ...DEFAULT_SETTINGS, scheduleId, isDefault: true };
  }

  async upsertSettings(scheduleId: string, dto: UpsertAttendanceSettingsDto) {
    return this.prisma.attendanceSettings.upsert({
      where: { scheduleId },
      create: { scheduleId, ...DEFAULT_SETTINGS, ...dto },
      update: dto,
    });
  }

  async getEffectiveSettings(scheduleId: string) {
    const settings = await this.prisma.attendanceSettings.findUnique({
      where: { scheduleId },
    });
    return settings ?? DEFAULT_SETTINGS;
  }
}
