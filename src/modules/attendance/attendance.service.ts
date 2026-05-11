import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceSettingsService } from '../attendance-settings/attendance-settings.service';
import {
  CheckInDto,
  UpdateAttendanceStatusDto,
  TeacherMarkDto,
} from './dto/attendance.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { uploadBufferToFirebaseStorage } from '../../common/firebase/firebase-admin';

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private settingsService: AttendanceSettingsService,
  ) {}

  async checkIn(
    user: JwtPayload,
    dto: CheckInDto,
    selfieFile?: Express.Multer.File,
  ) {
    if (!user.studentId) throw new ForbiddenException('เฉพาะนักศึกษาเท่านั้น');

    const student = await this.prisma.student.findUnique({
      where: { id: user.studentId },
    });
    if (!student) throw new NotFoundException('ไม่พบข้อมูลนักศึกษา');

    // ── 1. ตรวจ Device Binding ─────────────────────────────────────────────
    if (student.deviceId !== dto.deviceId) {
      throw new ForbiddenException('อุปกรณ์ไม่ตรงกับที่ผูกไว้ในระบบ');
    }

    // ── 2. โหลด Schedule พร้อม Building ───────────────────────────────────
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: dto.scheduleId },
      include: {
        section: true,
        room: { include: { building: true } },
      },
    });
    if (!schedule) throw new NotFoundException('ไม่พบตารางเรียน');

    // ── 3. ตรวจสิทธิ์เรียน (Enrollment) ──────────────────────────────────
    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        studentId_sectionId: {
          studentId: user.studentId,
          sectionId: schedule.sectionId,
        },
      },
    });
    if (!enrolled) throw new ForbiddenException('ไม่มีสิทธิ์เรียนในวิชานี้');

    // ── 4. ตรวจเช็คซ้ำ ────────────────────────────────────────────────────
    const classDate = new Date(dto.classDate);
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: {
        studentId_scheduleId_classDate: {
          studentId: user.studentId,
          scheduleId: dto.scheduleId,
          classDate,
        },
      },
    });
    if (existing && existing.status !== AttendanceStatus.NOT_CHECKED) {
      throw new BadRequestException('เช็คชื่อในคาบนี้แล้ว');
    }

    // ── 5. ตรวจช่วงเวลา ───────────────────────────────────────────────────
    const settings = await this.settingsService.getEffectiveSettings(
      dto.scheduleId,
    );
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const classStartMinutes = parseTimeToMinutes(schedule.startTime);
    const openFrom = classStartMinutes - settings.openBeforeMinutes;
    const closedAt = classStartMinutes + settings.closeAfterMinutes;

    if (nowMinutes < openFrom) {
      throw new BadRequestException(
        `ยังไม่ถึงเวลาเปิดรับเช็คชื่อ (เปิด ${settings.openBeforeMinutes} นาทีก่อนคาบ)`,
      );
    }
    if (nowMinutes > closedAt) {
      throw new BadRequestException('หมดเวลาเช็คชื่อแล้ว');
    }

    // ── 6. ตรวจ GPS (Haversine) ────────────────────────────────────────────
    const building = schedule.room.building;
    const distance = haversineDistance(
      dto.latitude,
      dto.longitude,
      building.latitude,
      building.longitude,
    );
    const isOutOfRange = distance > building.radiusMeters;

    // ── 7. คำนวณสถานะ ─────────────────────────────────────────────────────
    const minutesAfterStart = nowMinutes - classStartMinutes;
    const status =
      minutesAfterStart <= settings.lateAfterMinutes
        ? AttendanceStatus.ON_TIME
        : AttendanceStatus.LATE;

    // ── 8. Flag ผิดปกติ ───────────────────────────────────────────────────
    const flagReasons: string[] = [];
    if (isOutOfRange)
      flagReasons.push(`อยู่นอกรัศมีอาคาร (${Math.round(distance)} ม.)`);
    if (!selfieFile) flagReasons.push('ไม่มีรูปถ่าย Selfie');

    const selfieUrl = selfieFile
      ? await uploadBufferToFirebaseStorage({
          folder: 'selfies',
          originalName: selfieFile.originalname,
          mimeType: selfieFile.mimetype,
          buffer: selfieFile.buffer,
        })
      : null;

    // ── 9. บันทึก ─────────────────────────────────────────────────────────
    const record = await this.prisma.attendanceRecord.upsert({
      where: {
        studentId_scheduleId_classDate: {
          studentId: user.studentId,
          scheduleId: dto.scheduleId,
          classDate,
        },
      },
      create: {
        studentId: user.studentId,
        scheduleId: dto.scheduleId,
        classDate,
        checkedAt: now,
        status,
        selfieUrl,
        latitude: dto.latitude,
        longitude: dto.longitude,
        deviceId: dto.deviceId,

        deviceInfo: (dto.deviceInfo ?? {}) as Prisma.InputJsonValue,
        isFlagged: flagReasons.length > 0,
        flagReasons,
      },
      update: {
        checkedAt: now,
        status,
        selfieUrl,
        latitude: dto.latitude,
        longitude: dto.longitude,
        deviceId: dto.deviceId,

        deviceInfo: (dto.deviceInfo ?? {}) as Prisma.InputJsonValue,
        isFlagged: flagReasons.length > 0,
        flagReasons,
      },
    });

    return {
      ...record,
      distance: Math.round(distance),
      withinRange: !isOutOfRange,
      message:
        status === AttendanceStatus.ON_TIME
          ? 'เช็คชื่อสำเร็จ — ตรงเวลา'
          : 'เช็คชื่อสำเร็จ — มาสาย',
    };
  }

  async getAttendanceBySchedule(scheduleId: string, classDate?: string) {
    return this.prisma.attendanceRecord.findMany({
      where: {
        scheduleId,
        ...(classDate && { classDate: new Date(classDate) }),
      },
      include: {
        student: true,
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { student: { code: 'asc' } },
    });
  }

  async getStudentAttendanceHistory(studentId: string, scheduleId?: string) {
    return this.prisma.attendanceRecord.findMany({
      where: {
        studentId,
        ...(scheduleId && { scheduleId }),
      },
      include: {
        schedule: {
          include: { section: { include: { course: true } } },
        },
      },
      orderBy: { classDate: 'desc' },
    });
  }

  async teacherMark(dto: TeacherMarkDto, teacher: JwtPayload) {
    if (!teacher.teacherId)
      throw new ForbiddenException('เฉพาะอาจารย์/Admin เท่านั้น');
    const date = new Date(dto.classDate);
    const key = {
      studentId: dto.studentId,
      scheduleId: dto.scheduleId,
      classDate: date,
    };

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { studentId_scheduleId_classDate: key },
    });

    if (existing) {
      const [updated] = await this.prisma.$transaction([
        this.prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: { status: dto.status },
        }),
        this.prisma.auditLog.create({
          data: {
            attendanceRecordId: existing.id,
            modifiedById: teacher.sub,
            previousStatus: existing.status,
            newStatus: dto.status,
            reason: 'อาจารย์บันทึกสถานะด้วยตนเอง',
          },
        }),
      ]);
      return updated;
    }

    return this.prisma.attendanceRecord.create({
      data: {
        studentId: dto.studentId,
        scheduleId: dto.scheduleId,
        classDate: date,
        status: dto.status,
      },
    });
  }

  async getScheduleStats(scheduleId: string, classDate?: string) {
    const date = classDate ? new Date(classDate) : new Date();
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: { sectionId: true },
    });
    if (!schedule) throw new NotFoundException('ไม่พบตารางเรียน');
    const enrolledCount = await this.prisma.enrollment.count({
      where: { sectionId: schedule.sectionId },
    });
    const records = await this.prisma.attendanceRecord.findMany({
      where: { scheduleId, classDate: date },
      select: { status: true },
    });
    const count = (s: string) => records.filter((r) => r.status === s).length;
    const missingRecords = Math.max(0, enrolledCount - records.length);
    return {
      total: enrolledCount,
      onTime: count('ON_TIME'),
      late: count('LATE'),
      absent: count('ABSENT'),
      leave: count('LEAVE'),
      notChecked: count('NOT_CHECKED') + missingRecords,
    };
  }

  async getFlaggedRecords(scheduleId?: string) {
    return this.prisma.attendanceRecord.findMany({
      where: {
        isFlagged: true,
        ...(scheduleId && { scheduleId }),
      },
      include: {
        student: true,
        schedule: { include: { section: { include: { course: true } } } },
      },
      orderBy: { checkedAt: 'desc' },
    });
  }

  async updateAttendanceStatus(
    recordId: string,
    dto: UpdateAttendanceStatusDto,
    modifier: JwtPayload,
  ) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: recordId },
    });
    if (!record) throw new NotFoundException('ไม่พบรายการเช็คชื่อ');

    const [updated] = await this.prisma.$transaction([
      this.prisma.attendanceRecord.update({
        where: { id: recordId },
        data: { status: dto.status, note: dto.reason },
      }),
      this.prisma.auditLog.create({
        data: {
          attendanceRecordId: recordId,
          modifiedById: modifier.sub,
          previousStatus: record.status,
          newStatus: dto.status,
          reason: dto.reason,
        },
      }),
    ]);

    return updated;
  }
}
