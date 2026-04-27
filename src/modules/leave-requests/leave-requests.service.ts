import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { LeaveRequestStatus, AttendanceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeaveRequestDto, RejectLeaveRequestDto } from './dto/leave-request.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class LeaveRequestsService {
  constructor(private prisma: PrismaService) {}

  async createLeaveRequest(user: JwtPayload, dto: CreateLeaveRequestDto, evidenceFile?: Express.Multer.File) {
    if (!user.studentId) throw new ForbiddenException('เฉพาะนักศึกษาเท่านั้น');

    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: dto.attendanceRecordId },
    });
    if (!record) throw new NotFoundException('ไม่พบรายการเช็คชื่อ');
    if (record.studentId !== user.studentId) throw new ForbiddenException('ไม่มีสิทธิ์ยื่นคำขอลานี้');

    const existing = await this.prisma.leaveRequest.findFirst({
      where: {
        attendanceRecordId: dto.attendanceRecordId,
        status: LeaveRequestStatus.PENDING,
      },
    });
    if (existing) throw new BadRequestException('มีคำขอลาที่รอการอนุมัติอยู่แล้ว');

    const evidenceUrl = evidenceFile ? `/uploads/evidence/${evidenceFile.filename}` : null;

    return this.prisma.leaveRequest.create({
      data: {
        studentId: user.studentId,
        attendanceRecordId: dto.attendanceRecordId,
        leaveType: dto.leaveType,
        reason: dto.reason,
        evidenceUrl,
      },
      include: { student: true, attendanceRecord: true },
    });
  }

  async findAllPaginated(
    params: { page: number; limit: number; status?: LeaveRequestStatus },
    teacherId?: string,
  ) {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(teacherId && {
        attendanceRecord: { schedule: { teacherId } },
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
}
