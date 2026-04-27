import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getScheduleStudentSummary(scheduleId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { section: { include: { course: true } } },
    });
    if (!schedule) throw new NotFoundException('ไม่พบตารางเรียน');

    const [enrollments, records] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { sectionId: schedule.sectionId },
        include: {
          student: {
            select: {
              id: true, code: true, firstName: true, lastName: true, profileImageUrl: true,
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { student: { code: 'asc' } },
      }),
      this.prisma.attendanceRecord.findMany({
        where: { scheduleId },
        select: { studentId: true, status: true, classDate: true },
      }),
    ]);

    const totalClasses = new Set(records.map((r) => r.classDate.toISOString())).size;

    const byStudent = new Map<string, typeof records>();
    for (const r of records) {
      const arr = byStudent.get(r.studentId) ?? [];
      arr.push(r);
      byStudent.set(r.studentId, arr);
    }

    const count = (recs: typeof records, s: AttendanceStatus) =>
      recs.filter((r) => r.status === s).length;

    return {
      schedule: {
        id: schedule.id,
        courseCode: schedule.section.course.code,
        courseName: schedule.section.course.name,
        sectionName: schedule.section.name,
        totalClasses,
      },
      students: enrollments.map((e) => {
        const recs   = byStudent.get(e.studentId) ?? [];
        const onTime = count(recs, AttendanceStatus.ON_TIME);
        const late   = count(recs, AttendanceStatus.LATE);
        const absent = count(recs, AttendanceStatus.ABSENT);
        const leave  = count(recs, AttendanceStatus.LEAVE);
        const present = onTime + late;
        return {
          student: e.student,
          onTime, late, absent, leave,
          notChecked: totalClasses - recs.length,
          attendanceRate: totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0,
        };
      }),
    };
  }

  async getAttendanceSummaryBySchedule(scheduleId: string) {
    const records = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: { scheduleId },
      _count: { status: true },
    });

    const total = await this.prisma.attendanceRecord.count({ where: { scheduleId } });
    const summary: Record<string, number> = {};
    for (const r of records) {
      summary[r.status] = r._count.status;
    }

    return { scheduleId, total, summary };
  }

  async getStudentAttendanceSummary(studentId: string, semesterId?: string) {
    const schedules = await this.prisma.schedule.findMany({
      where: {
        semesterId,
        section: {
          enrollments: { some: { studentId } },
        },
      },
      include: {
        section: { include: { course: true } },
        attendanceRecords: {
          where: { studentId },
          select: { status: true },
        },
      },
    });

    return schedules.map((s) => {
      const counts = Object.values(AttendanceStatus).reduce(
        (acc, st) => ({ ...acc, [st]: 0 }),
        {} as Record<string, number>,
      );
      for (const r of s.attendanceRecords) counts[r.status]++;
      const total = s.attendanceRecords.length;
      const present = (counts[AttendanceStatus.ON_TIME] ?? 0) + (counts[AttendanceStatus.LATE] ?? 0) + (counts[AttendanceStatus.LEAVE] ?? 0);
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        scheduleId: s.id,
        course: s.section.course.name,
        section: s.section.name,
        counts,
        total,
        percentage,
      };
    });
  }

  async getExportData(filters: {
    semesterId?: string;
    facultyId?: string;
    departmentId?: string;
    scheduleId?: string;
  }) {
    return this.prisma.attendanceRecord.findMany({
      where: {
        ...(filters.scheduleId && { scheduleId: filters.scheduleId }),
        schedule: {
          ...(filters.semesterId && { semesterId: filters.semesterId }),
          section: {
            course: {
              ...(filters.facultyId && { facultyId: filters.facultyId }),
              ...(filters.departmentId && { departmentId: filters.departmentId }),
            },
          },
        },
      },
      include: {
        student: true,
        schedule: { include: { section: { include: { course: true } } } },
      },
      orderBy: [{ classDate: 'asc' }, { student: { code: 'asc' } }],
    });
  }
}
