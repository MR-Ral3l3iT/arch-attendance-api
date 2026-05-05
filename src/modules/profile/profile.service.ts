import { Injectable, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  deleteFirebaseStorageFileByUrl,
  uploadBufferToFirebaseStorage,
} from '../../common/firebase/firebase-admin';

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
    const url = await uploadBufferToFirebaseStorage({
      folder: 'avatars',
      originalName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });

    if (user.role === Role.TEACHER && user.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: user.teacherId },
      });
      await deleteFirebaseStorageFileByUrl(teacher?.profileImageUrl);
      await this.prisma.teacher.update({
        where: { id: user.teacherId },
        data: { profileImageUrl: url },
      });
    } else if (user.role === Role.STUDENT && user.studentId) {
      const student = await this.prisma.student.findUnique({
        where: { id: user.studentId },
      });
      await deleteFirebaseStorageFileByUrl(student?.profileImageUrl);
      await this.prisma.student.update({
        where: { id: user.studentId },
        data: { profileImageUrl: url },
      });
    } else {
      await deleteFirebaseStorageFileByUrl(url);
      throw new BadRequestException('บัญชีนี้ไม่สามารถอัปโหลดรูปโปรไฟล์ได้');
    }

    return { profileImageUrl: url };
  }
}
