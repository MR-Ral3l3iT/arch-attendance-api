import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { attendanceRecordId?: string; modifiedById?: string }) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(filters?.attendanceRecordId && { attendanceRecordId: filters.attendanceRecordId }),
        ...(filters?.modifiedById && { modifiedById: filters.modifiedById }),
      },
      include: {
        attendanceRecord: {
          include: { student: true, schedule: { include: { section: { include: { course: true } } } } },
        },
        modifiedBy: { select: { username: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByAttendanceRecord(attendanceRecordId: string) {
    return this.prisma.auditLog.findMany({
      where: { attendanceRecordId },
      include: { modifiedBy: { select: { username: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
