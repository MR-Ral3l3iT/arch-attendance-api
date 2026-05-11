import { Injectable, NotFoundException } from '@nestjs/common';
import { DayOfWeek } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  CreateEnrollmentDto,
  BulkEnrollmentDto,
} from './dto/schedules.dto';

function prismaDayFromJsDate(d: Date): DayOfWeek {
  const map: DayOfWeek[] = [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];
  return map[d.getDay()];
}

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async createSchedule(dto: CreateScheduleDto) {
    return this.prisma.schedule.create({
      data: dto,
      include: {
        section: { include: { course: true } },
        room: { include: { building: true } },
        teacher: true,
        semester: true,
      },
    });
  }

  async findAllSchedules(filters?: {
    semesterId?: string;
    teacherId?: string;
    sectionId?: string;
  }) {
    return this.prisma.schedule.findMany({
      where: {
        ...(filters?.semesterId && { semesterId: filters.semesterId }),
        ...(filters?.teacherId && { teacherId: filters.teacherId }),
        ...(filters?.sectionId && { sectionId: filters.sectionId }),
      },
      include: {
        section: {
          include: {
            course: true,
            semester: { include: { academicYear: true } },
          },
        },
        room: { include: { building: true } },
        teacher: true,
        semester: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOneSchedule(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        section: { include: { course: true } },
        room: { include: { building: true } },
        teacher: true,
        semester: true,
        attendanceSettings: true,
      },
    });
    if (!schedule) throw new NotFoundException(`ไม่พบตารางเรียนรหัส ${id}`);
    return schedule;
  }

  async updateSchedule(id: string, dto: UpdateScheduleDto) {
    await this.findOneSchedule(id);
    return this.prisma.schedule.update({
      where: { id },
      data: dto,
      include: {
        section: { include: { course: true } },
        room: { include: { building: true } },
        teacher: true,
      },
    });
  }

  async removeSchedule(id: string) {
    await this.findOneSchedule(id);
    return this.prisma.schedule.delete({ where: { id } });
  }

  // ── Enrollment ────────────────────────────────────────────────────────────

  async enroll(dto: CreateEnrollmentDto) {
    return this.prisma.enrollment.upsert({
      where: {
        studentId_sectionId: {
          studentId: dto.studentId,
          sectionId: dto.sectionId,
        },
      },
      create: dto,
      update: {},
      include: { student: true, section: { include: { course: true } } },
    });
  }

  async bulkEnroll(dto: BulkEnrollmentDto) {
    const results = {
      success: 0,
      failed: [] as { studentId: string; reason: string }[],
    };

    for (const studentId of dto.studentIds) {
      try {
        await this.enroll({ studentId, sectionId: dto.sectionId });
        results.success++;
      } catch (err) {
        results.failed.push({ studentId, reason: (err as Error).message });
      }
    }

    return results;
  }

  async findEnrollments(sectionId?: string, studentId?: string) {
    return this.prisma.enrollment.findMany({
      where: {
        ...(sectionId && { sectionId }),
        ...(studentId && { studentId }),
      },
      include: {
        student: true,
        section: { include: { course: true } },
      },
    });
  }

  async removeEnrollment(studentId: string, sectionId: string) {
    return this.prisma.enrollment.delete({
      where: { studentId_sectionId: { studentId, sectionId } },
    });
  }

  // ── Teacher's schedule ────────────────────────────────────────────────────

  async findTeacherSchedules(teacherId: string, semesterId?: string) {
    return this.prisma.schedule.findMany({
      where: { teacherId, ...(semesterId && { semesterId }) },
      include: {
        section: {
          include: {
            course: true,
            semester: { include: { academicYear: true } },
          },
        },
        room: { include: { building: true } },
        semester: true,
        attendanceSettings: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findStudentSchedules(studentId: string, semesterId?: string) {
    let effectiveSemesterId = semesterId?.trim() ?? '';
    if (!effectiveSemesterId) {
      const activeSemester = await this.prisma.semester.findFirst({
        where: { isActive: true },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      });
      effectiveSemesterId = activeSemester?.id ?? '';
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      select: { sectionId: true },
    });
    const sectionIds = enrollments.map((e) => e.sectionId);

    return this.prisma.schedule.findMany({
      where: {
        sectionId: { in: sectionIds },
        ...(effectiveSemesterId && { semesterId: effectiveSemesterId }),
      },
      include: {
        section: {
          include: {
            course: true,
            semester: { include: { academicYear: true } },
          },
        },
        room: { include: { building: true } },
        teacher: true,
        semester: true,
        attendanceSettings: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /** ตารางเรียนของนักศึกษาเฉพาะวันนี้ (ตามวันในสัปดาห์ของเครื่องเซิร์ฟเวอร์) */
  async findStudentSchedulesToday(studentId: string) {
    const dayOfWeek = prismaDayFromJsDate(new Date());
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      select: { sectionId: true },
    });
    const sectionIds = enrollments.map((e) => e.sectionId);
    if (sectionIds.length === 0) {
      return [];
    }
    return this.prisma.schedule.findMany({
      where: {
        sectionId: { in: sectionIds },
        dayOfWeek,
      },
      include: {
        section: {
          include: {
            course: true,
            semester: { include: { academicYear: true } },
          },
        },
        room: { include: { building: true } },
        teacher: true,
        semester: true,
        attendanceSettings: true,
      },
      orderBy: [{ startTime: 'asc' }],
    });
  }
}
