import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enroll(dto: CreateEnrollmentDto) {
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        studentId_sectionId: {
          studentId: dto.studentId,
          sectionId: dto.sectionId,
        },
      },
    });
    if (existing)
      throw new ConflictException('นักศึกษานี้ลงทะเบียนในกลุ่มนี้แล้ว');

    return this.prisma.enrollment.create({
      data: dto,
      include: {
        student: { include: { department: true, yearLevel: true } },
      },
    });
  }

  async unenroll(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });
    if (!enrollment) throw new NotFoundException('ไม่พบข้อมูลการลงทะเบียน');
    await this.prisma.enrollment.delete({ where: { id } });
    return { message: 'ยกเลิกการลงทะเบียนสำเร็จ' };
  }

  async findBySectionId(sectionId: string) {
    return this.prisma.enrollment.findMany({
      where: { sectionId },
      include: {
        student: { include: { department: true, yearLevel: true } },
      },
      orderBy: { student: { code: 'asc' } },
    });
  }
}
