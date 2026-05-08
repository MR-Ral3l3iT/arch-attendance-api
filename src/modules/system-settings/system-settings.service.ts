import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const KEYS = {
  openBeforeMinutes: 'CHECK_IN_OPEN_BEFORE_MINUTES',
  closeAfterMinutes: 'CHECK_IN_ABSENT_AFTER_MINUTES',
  lateThresholdMinutes: 'CHECK_IN_LATE_AFTER_MINUTES',
  gpsRadiusMeters: 'GPS_RADIUS_METERS',
  requireSelfie: 'REQUIRE_SELFIE',
} as const;

const DEFAULTS: Record<string, string> = {
  CHECK_IN_OPEN_BEFORE_MINUTES: '15',
  CHECK_IN_ABSENT_AFTER_MINUTES: '30',
  CHECK_IN_LATE_AFTER_MINUTES: '15',
  GPS_RADIUS_METERS: '100',
  REQUIRE_SELFIE: 'true',
};

@Injectable()
export class SystemSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    const rows = await this.prisma.systemSettings.findMany({
      where: { key: { in: Object.values(KEYS) } },
    });

    const map = new Map(rows.map((r) => [r.key, r.value]));
    const get = (k: string) => map.get(k) ?? DEFAULTS[k] ?? '0';

    return {
      openBeforeMinutes: parseInt(get(KEYS.openBeforeMinutes)),
      closeAfterMinutes: parseInt(get(KEYS.closeAfterMinutes)),
      lateThresholdMinutes: parseInt(get(KEYS.lateThresholdMinutes)),
      gpsRadiusMeters: parseInt(get(KEYS.gpsRadiusMeters)),
      requireSelfie: get(KEYS.requireSelfie) === 'true',
    };
  }

  async updateSettings(dto: {
    openBeforeMinutes?: number;
    closeAfterMinutes?: number;
    lateThresholdMinutes?: number;
    gpsRadiusMeters?: number;
    requireSelfie?: boolean;
  }) {
    const updates: { key: string; value: string }[] = [];

    if (dto.openBeforeMinutes != null)
      updates.push({
        key: KEYS.openBeforeMinutes,
        value: String(dto.openBeforeMinutes),
      });
    if (dto.closeAfterMinutes != null)
      updates.push({
        key: KEYS.closeAfterMinutes,
        value: String(dto.closeAfterMinutes),
      });
    if (dto.lateThresholdMinutes != null)
      updates.push({
        key: KEYS.lateThresholdMinutes,
        value: String(dto.lateThresholdMinutes),
      });
    if (dto.gpsRadiusMeters != null)
      updates.push({
        key: KEYS.gpsRadiusMeters,
        value: String(dto.gpsRadiusMeters),
      });
    if (dto.requireSelfie != null)
      updates.push({
        key: KEYS.requireSelfie,
        value: String(dto.requireSelfie),
      });

    await Promise.all(
      updates.map(({ key, value }) =>
        this.prisma.systemSettings.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        }),
      ),
    );

    return this.getSettings();
  }

  async getHolidays(semesterId: string) {
    if (!semesterId) return [];
    return this.prisma.holiday.findMany({
      where: { semesterId },
      orderBy: { date: 'asc' },
    });
  }

  async createHoliday(dto: {
    semesterId: string;
    date: string;
    name: string;
    createdById?: string;
  }) {
    return this.prisma.holiday.upsert({
      where: {
        semesterId_date: {
          semesterId: dto.semesterId,
          date: new Date(dto.date),
        },
      },
      create: {
        semesterId: dto.semesterId,
        date: new Date(dto.date),
        name: dto.name,
        createdById: dto.createdById,
      },
      update: {
        name: dto.name,
        createdById: dto.createdById,
      },
    });
  }

  async deleteHoliday(id: string) {
    return this.prisma.holiday.delete({ where: { id } });
  }
}
