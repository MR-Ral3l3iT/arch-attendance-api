import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto, CreateStudentDto, UpdateStudentDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ── Teacher ───────────────────────────────────────────────────────────────

  async createTeacher(dto: CreateTeacherDto) {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) throw new ConflictException(`ชื่อผู้ใช้งาน ${dto.username} มีอยู่แล้ว`);

    const existCode = await this.prisma.teacher.findUnique({ where: { code: dto.code } });
    if (existCode) throw new ConflictException(`รหัสอาจารย์ ${dto.code} มีอยู่แล้ว`);

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const { password, code, firstName, lastName, email, phone, facultyId, departmentId, username } = dto;
    void password;

    return this.prisma.user.create({
      data: {
        username,
        passwordHash,
        role: Role.TEACHER,
        teacher: {
          create: { code, firstName, lastName, email, phone, facultyId, departmentId },
        },
      },
      include: { teacher: true },
    });
  }

  async findAllTeachers(
    facultyId?: string,
    departmentId?: string,
    page = 1,
    limit = 20,
    search?: string,
    isActive?: boolean,
  ) {
    const where = {
      ...(facultyId && { facultyId }),
      ...(departmentId && { departmentId }),
      ...(isActive !== undefined && { user: { isActive } }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [total, data] = await Promise.all([
      this.prisma.teacher.count({ where }),
      this.prisma.teacher.findMany({
        where,
        include: { user: { select: { username: true, isActive: true } }, faculty: true, department: true },
        orderBy: { code: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOneTeacher(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: { select: { username: true, isActive: true } }, faculty: true, department: true },
    });
    if (!teacher) throw new NotFoundException(`ไม่พบอาจารย์รหัส ${id}`);
    return teacher;
  }

  async updateTeacher(id: string, dto: UpdateTeacherDto) {
    const teacher = await this.findOneTeacher(id);
    const { password, username, code, firstName, lastName, email, phone, facultyId, departmentId } = dto;

    const data: Record<string, unknown> = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (facultyId !== undefined) data.facultyId = facultyId;
    if (departmentId !== undefined) data.departmentId = departmentId;

    await this.prisma.teacher.update({ where: { id }, data });

    if (password || username) {
      const userData: Record<string, unknown> = {};
      if (username) userData.username = username;
      if (password) userData.passwordHash = await bcrypt.hash(password, 12);
      await this.prisma.user.update({ where: { id: teacher.userId }, data: userData });
    }

    return this.findOneTeacher(id);
  }

  async removeTeacher(id: string) {
    const teacher = await this.findOneTeacher(id);
    await this.prisma.user.delete({ where: { id: teacher.userId } });
    return { message: 'ลบข้อมูลอาจารย์สำเร็จ' };
  }

  async bulkImportTeachers(rows: CreateTeacherDto[]) {
    const results = { success: 0, failed: [] as { row: number; code: string; reason: string }[] };

    for (let i = 0; i < rows.length; i++) {
      try {
        await this.createTeacher(rows[i]);
        results.success++;
      } catch (err) {
        results.failed.push({ row: i + 1, code: rows[i].code, reason: (err as Error).message });
      }
    }

    return results;
  }

  // ── Student ───────────────────────────────────────────────────────────────

  async createStudent(dto: CreateStudentDto) {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.email } });
    if (existing) throw new ConflictException(`อีเมล ${dto.email} ถูกใช้งานแล้ว`);

    const existCode = await this.prisma.student.findUnique({ where: { code: dto.code } });
    if (existCode) throw new ConflictException(`รหัสนักศึกษา ${dto.code} มีอยู่แล้ว`);

    // username = email, password = รหัสนักศึกษา (auto)
    const passwordHash = await bcrypt.hash(dto.code, 12);
    const { code, firstName, lastName, email, phone, facultyId, departmentId, yearLevelId } = dto;

    return this.prisma.user.create({
      data: {
        username: email,
        passwordHash,
        role: Role.STUDENT,
        student: {
          create: { code, firstName, lastName, email, phone, facultyId, departmentId, yearLevelId },
        },
      },
      include: { student: true },
    });
  }

  async findAllStudents(filters?: {
    facultyId?: string;
    departmentId?: string;
    yearLevelId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const search = filters?.search;
    const where = {
      ...(filters?.facultyId && { facultyId: filters.facultyId }),
      ...(filters?.departmentId && { departmentId: filters.departmentId }),
      ...(filters?.yearLevelId && { yearLevelId: filters.yearLevelId }),
      ...(filters?.isActive !== undefined && { user: { isActive: filters.isActive } }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [total, data] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        include: {
          user: { select: { username: true, isActive: true } },
          faculty: true,
          department: true,
          yearLevel: true,
        },
        orderBy: { code: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOneStudent(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { username: true, isActive: true } },
        faculty: true,
        department: true,
        yearLevel: true,
      },
    });
    if (!student) throw new NotFoundException(`ไม่พบนักศึกษารหัส ${id}`);
    return student;
  }

  async updateStudent(id: string, dto: UpdateStudentDto) {
    const student = await this.findOneStudent(id);
    const { code, firstName, lastName, email, phone, facultyId, departmentId, yearLevelId } = dto;

    const data: Record<string, unknown> = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (facultyId !== undefined) data.facultyId = facultyId;
    if (departmentId !== undefined) data.departmentId = departmentId;
    if (yearLevelId !== undefined) data.yearLevelId = yearLevelId;

    await this.prisma.student.update({ where: { id }, data });

    // auto-sync: email เปลี่ยน → username เปลี่ยนตาม
    if (email !== undefined) {
      await this.prisma.user.update({ where: { id: student.userId }, data: { username: email } });
    }

    // suppress unused-var warning
    void code;

    return this.findOneStudent(id);
  }

  async removeStudent(id: string) {
    const student = await this.findOneStudent(id);
    await this.prisma.user.delete({ where: { id: student.userId } });
    return { message: 'ลบข้อมูลนักศึกษาสำเร็จ' };
  }

  async resetDeviceBinding(id: string) {
    await this.findOneStudent(id);
    return this.prisma.student.update({
      where: { id },
      data: { deviceId: null, deviceInfo: {} },
    });
  }

  async bulkImportStudents(rows: CreateStudentDto[]) {
    const results = { success: 0, failed: [] as { row: number; code: string; reason: string }[] };

    for (let i = 0; i < rows.length; i++) {
      try {
        await this.createStudent(rows[i]);
        results.success++;
      } catch (err) {
        results.failed.push({ row: i + 1, code: rows[i].code, reason: (err as Error).message });
      }
    }

    return results;
  }
}
