import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, LeaveRequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

function dateKeyUTC(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function addDaysUTC(d: Date, days: number): Date {
  const nd = new Date(d);
  nd.setUTCDate(nd.getUTCDate() + days);
  return nd;
}

function startOfDayUTC(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function jsDayFromPrismaDay(d: string): number {
  // DayOfWeek enum: MONDAY..SUNDAY
  switch (d) {
    case 'SUNDAY':
      return 0;
    case 'MONDAY':
      return 1;
    case 'TUESDAY':
      return 2;
    case 'WEDNESDAY':
      return 3;
    case 'THURSDAY':
      return 4;
    case 'FRIDAY':
      return 5;
    case 'SATURDAY':
      return 6;
    default:
      return 0;
  }
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getScheduleStudentSummary(scheduleId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        section: { include: { course: true } },
        semester: { select: { id: true, startDate: true, endDate: true } },
        cancellations: { select: { classDate: true } },
      },
    });
    if (!schedule) throw new NotFoundException('ไม่พบตารางเรียน');

    const [enrollments, holidays, records] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { sectionId: schedule.sectionId },
        include: {
          student: {
            select: {
              id: true,
              code: true,
              firstName: true,
              lastName: true,
              profileImageUrl: true,
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { student: { code: 'asc' } },
      }),
      this.prisma.holiday.findMany({
        where: { semesterId: schedule.semesterId },
        select: { date: true },
      }),
      this.prisma.attendanceRecord.findMany({
        where: {
          scheduleId,
          classDate: {
            gte: schedule.semester.startDate,
            lte: new Date(
              Math.min(Date.now(), schedule.semester.endDate.getTime()),
            ),
          },
        },
        select: {
          studentId: true,
          status: true,
          classDate: true,
          leaveRequests: {
            where: { status: LeaveRequestStatus.APPROVED },
            select: { id: true },
          },
        },
      }),
    ]);

    // Denominator: คาบที่ "ควรมีสอน" ตั้งแต่เปิดเทอม → วันนี้ (หรือถึงวันสิ้นสุดเทอม)
    // ไม่รวมวันหยุด และวันที่อาจารย์ยกคลาส
    const start = startOfDayUTC(schedule.semester.startDate);
    const end = startOfDayUTC(
      new Date(Math.min(Date.now(), schedule.semester.endDate.getTime())),
    );

    const holidayKeys = new Set(holidays.map((h) => dateKeyUTC(h.date)));
    const cancelKeys = new Set(
      (schedule.cancellations ?? []).map((c) => dateKeyUTC(c.classDate)),
    );

    const targetJsDay = jsDayFromPrismaDay(String(schedule.dayOfWeek));
    const eligibleDateKeys: string[] = [];
    for (let d = start; d.getTime() <= end.getTime(); d = addDaysUTC(d, 1)) {
      if (d.getUTCDay() !== targetJsDay) continue;
      const k = dateKeyUTC(d);
      if (holidayKeys.has(k)) continue;
      if (cancelKeys.has(k)) continue;
      eligibleDateKeys.push(k);
    }

    const eligibleSet = new Set(eligibleDateKeys);
    const totalClasses = eligibleDateKeys.length;

    const byStudent = new Map<string, typeof records>();
    for (const r of records) {
      if (!eligibleSet.has(dateKeyUTC(r.classDate))) continue;
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
        const recs = byStudent.get(e.studentId) ?? [];
        const onTime = count(recs, AttendanceStatus.ON_TIME);
        const late = count(recs, AttendanceStatus.LATE);
        const absent = count(recs, AttendanceStatus.ABSENT);
        const leaveApproved = recs.filter(
          (r) =>
            r.status === AttendanceStatus.LEAVE && r.leaveRequests.length > 0,
        ).length;
        const leaveUnapproved =
          count(recs, AttendanceStatus.LEAVE) - leaveApproved;
        const present = onTime + late + leaveApproved;
        return {
          student: e.student,
          onTime,
          late,
          absent: absent + Math.max(0, leaveUnapproved),
          leave: leaveApproved,
          notChecked: totalClasses - recs.length,
          attendanceRate:
            totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 100,
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

    const total = await this.prisma.attendanceRecord.count({
      where: { scheduleId },
    });
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
      const present =
        (counts[AttendanceStatus.ON_TIME] ?? 0) +
        (counts[AttendanceStatus.LATE] ?? 0) +
        (counts[AttendanceStatus.LEAVE] ?? 0);
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
              ...(filters.departmentId && {
                departmentId: filters.departmentId,
              }),
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
