import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { LeaveRequestStatus, AttendanceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateLeaveRequestDto,
  RejectLeaveRequestDto,
  UpdateLeaveRequestDto,
} from './dto/leave-request.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { uploadBufferToFirebaseStorage } from '../../common/firebase/firebase-admin';

@Injectable()
export class LeaveRequestsService {
  constructor(private prisma: PrismaService) {}

  async createLeaveRequest(user: JwtPayload, dto: CreateLeaveRequestDto, evidenceFile?: Express.Multer.File) {
    if (!user.studentId) throw new ForbiddenException('เฉพาะนักศึกษาเท่านั้น');

    let record: { id: string; studentId: string };
    if (dto.attendanceRecordId) {
      const foundRecord = await this.prisma.attendanceRecord.findUnique({
        where: { id: dto.attendanceRecordId },
      });
      if (!foundRecord) throw new NotFoundException('ไม่พบรายการเช็คชื่อ');
      if (foundRecord.studentId !== user.studentId) throw new ForbiddenException('ไม่มีสิทธิ์ยื่นคำขอลานี้');
      record = foundRecord;
    } else if (dto.scheduleId) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          studentId: user.studentId,
          section: {
            schedules: {
              some: { id: dto.scheduleId },
            },
          },
        },
      });
      if (!enrollment) throw new ForbiddenException('ไม่มีสิทธิ์ยื่นคำขอลาสำหรับวิชานี้');

      const now = new Date();
      const classDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      record = await this.prisma.attendanceRecord.upsert({
        where: {
          studentId_scheduleId_classDate: {
            studentId: user.studentId,
            scheduleId: dto.scheduleId,
            classDate,
          },
        },
        update: {},
        create: {
          studentId: user.studentId,
          scheduleId: dto.scheduleId,
          classDate,
          status: AttendanceStatus.NOT_CHECKED,
          flagReasons: [],
        },
      });
    } else {
      throw new BadRequestException('กรุณาระบุ attendanceRecordId หรือ scheduleId');
    }

    const existing = await this.prisma.leaveRequest.findFirst({
      where: {
        attendanceRecordId: record.id,
        status: LeaveRequestStatus.PENDING,
      },
    });
    if (existing) throw new BadRequestException('มีคำขอลาที่รอการอนุมัติอยู่แล้ว');

    const evidenceUrl = evidenceFile
      ? await uploadBufferToFirebaseStorage({
          folder: 'leave-evidence',
          originalName: evidenceFile.originalname,
          mimeType: evidenceFile.mimetype,
          buffer: evidenceFile.buffer,
        })
      : null;

    return this.prisma.leaveRequest.create({
      data: {
        studentId: user.studentId,
        attendanceRecordId: record.id,
        leaveType: dto.leaveType,
        reason: dto.reason,
        evidenceUrl,
      },
      include: { student: true, attendanceRecord: true },
    });
  }

  async findAllPaginated(
    params: { page: number; limit: number; status?: LeaveRequestStatus; search?: string; classDate?: string },
    teacherId?: string,
  ) {
    const { page, limit, status, search, classDate } = params;
    const skip = (page - 1) * limit;

    const attendanceRecordFilter: Record<string, unknown> = {};
    if (teacherId) attendanceRecordFilter.schedule = { teacherId };
    if (classDate) {
      const start = new Date(`${classDate}T00:00:00.000Z`);
      const end   = new Date(`${classDate}T23:59:59.999Z`);
      attendanceRecordFilter.classDate = { gte: start, lte: end };
    }

    const where = {
      ...(status && { status }),
      ...(Object.keys(attendanceRecordFilter).length > 0 && {
        attendanceRecord: attendanceRecordFilter,
      }),
      ...(search && {
        student: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName:  { contains: search, mode: 'insensitive' as const } },
            { code:      { contains: search, mode: 'insensitive' as const } },
          ],
        },
      }),
    };

    const [records, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        include: {
          student: true,
          attendanceRecord: {
            include: {
              schedule: {
                include: {
                  section: { include: { course: true } },
                  room: { include: { building: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    const data = records.map((r) => ({
      id: r.id,
      leaveType: r.leaveType,
      reason: r.reason,
      status: r.status,
      classDate: r.attendanceRecord.classDate,
      evidenceUrl: r.evidenceUrl,
      reviewedAt: r.approvedAt,
      reviewNote: r.rejectReason,
      student: r.student,
      schedule: r.attendanceRecord.schedule,
      createdAt: r.createdAt,
    }));

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPendingRequests(teacherId?: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        status: LeaveRequestStatus.PENDING,
        ...(teacherId && {
          attendanceRecord: {
            schedule: { teacherId },
          },
        }),
      },
      include: {
        student: true,
        attendanceRecord: {
          include: { schedule: { include: { section: { include: { course: true } } } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findStudentRequests(studentId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { studentId },
      include: {
        attendanceRecord: {
          include: { schedule: { include: { section: { include: { course: true } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveLeaveRequest(id: string, teacher: JwtPayload) {
    if (!teacher.teacherId) throw new ForbiddenException('เฉพาะอาจารย์เท่านั้น');

    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { attendanceRecord: true },
    });
    if (!request) throw new NotFoundException('ไม่พบคำขอลา');
    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('คำขอลานี้ถูกดำเนินการแล้ว');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveRequestStatus.APPROVED,
          approvedById: teacher.teacherId,
          approvedAt: new Date(),
        },
      }),
      this.prisma.attendanceRecord.update({
        where: { id: request.attendanceRecordId },
        data: { status: AttendanceStatus.LEAVE },
      }),
      this.prisma.auditLog.create({
        data: {
          attendanceRecordId: request.attendanceRecordId,
          modifiedById: teacher.sub,
          previousStatus: request.attendanceRecord.status,
          newStatus: AttendanceStatus.LEAVE,
          reason: `อนุมัติคำขอลา: ${request.reason}`,
        },
      }),
    ]);

    return updated;
  }

  async rejectLeaveRequest(id: string, teacher: JwtPayload, dto: RejectLeaveRequestDto) {
    if (!teacher.teacherId) throw new ForbiddenException('เฉพาะอาจารย์เท่านั้น');

    const request = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('ไม่พบคำขอลา');
    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('คำขอลานี้ถูกดำเนินการแล้ว');
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveRequestStatus.REJECTED,
        approvedById: teacher.teacherId,
        approvedAt: new Date(),
        rejectReason: dto.rejectReason,
      },
    });
  }

  async updateStudentPendingRequest(id: string, user: JwtPayload, dto: UpdateLeaveRequestDto) {
    if (!user.studentId) throw new ForbiddenException('เฉพาะนักศึกษาเท่านั้น');

    const request = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('ไม่พบคำขอลา');
    if (request.studentId !== user.studentId) {
      throw new ForbiddenException('ไม่มีสิทธิ์แก้ไขคำขอลานี้');
    }
    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('แก้ไขได้เฉพาะคำขอลาที่รอพิจารณา');
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        leaveType: dto.leaveType,
        reason: dto.reason,
      },
    });
  }
}
