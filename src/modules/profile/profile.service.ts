import { Injectable, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as fs from 'fs';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(user: JwtPayload) {
    if (user.role === Role.STUDENT && user.studentId) {
      const student = await this.prisma.student.findUnique({
        where: { id: user.studentId },
        include: {
          department: true,
          faculty: true,
          yearLevel: true,
        },
      });
      if (!student) {
        throw new BadRequestException('ไม่พบข้อมูลนักศึกษา');
      }
      return {
        role: user.role,
        studentId: student.id,
        studentCode: student.code,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        department: student.department?.name ?? null,
        faculty: student.faculty?.name ?? null,
        yearLevel: student.yearLevel?.name ?? null,
        profileImageUrl: student.profileImageUrl,
      };
    }

    if (user.role === Role.TEACHER && user.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: user.teacherId },
        include: {
          department: true,
          faculty: true,
        },
      });
      if (!teacher) {
        throw new BadRequestException('ไม่พบข้อมูลอาจารย์');
      }
      return {
        role: user.role,
        teacherId: teacher.id,
        teacherCode: teacher.code,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        department: teacher.department?.name ?? null,
        faculty: teacher.faculty?.name ?? null,
        profileImageUrl: teacher.profileImageUrl,
      };
    }

    throw new BadRequestException('บัญชีนี้ไม่สามารถอ่านข้อมูลโปรไฟล์ได้');
  }

  async updateAvatar(user: JwtPayload, file: Express.Multer.File) {
    const url = `/uploads/avatars/${file.filename}`;

    if (user.role === Role.TEACHER && user.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({ where: { id: user.teacherId } });
      if (teacher?.profileImageUrl) this.deleteFile(teacher.profileImageUrl);
      await this.prisma.teacher.update({ where: { id: user.teacherId }, data: { profileImageUrl: url } });
    } else if (user.role === Role.STUDENT && user.studentId) {
      const student = await this.prisma.student.findUnique({ where: { id: user.studentId } });
      if (student?.profileImageUrl) this.deleteFile(student.profileImageUrl);
      await this.prisma.student.update({ where: { id: user.studentId }, data: { profileImageUrl: url } });
    } else {
      this.deleteFile(url);
      throw new BadRequestException('บัญชีนี้ไม่สามารถอัปโหลดรูปโปรไฟล์ได้');
    }

    return { profileImageUrl: url };
  }

  private deleteFile(relativeUrl: string) {
    try {
      const filePath = join(process.cwd(), relativeUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // ignore — file might already be missing
    }
  }
}
