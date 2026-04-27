import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAcademicYearDto, UpdateAcademicYearDto,
  CreateSemesterDto, UpdateSemesterDto,
  CreateFacultyDto, UpdateFacultyDto,
  CreateDivisionDto, UpdateDivisionDto,
  CreateDepartmentDto, UpdateDepartmentDto,
  CreateYearLevelDto, UpdateYearLevelDto,
} from './dto/academic.dto';

@Injectable()
export class AcademicService {
  constructor(private prisma: PrismaService) {}

  // ── AcademicYear ──────────────────────────────────────────────────────────

  async createAcademicYear(dto: CreateAcademicYearDto) {
    return this.prisma.academicYear.create({ data: dto });
  }

  async findAllAcademicYears() {
    return this.prisma.academicYear.findMany({
      include: { semesters: true },
      orderBy: { name: 'desc' },
    });
  }

  async findOneAcademicYear(id: string) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id },
      include: { semesters: true },
    });
    if (!year) throw new NotFoundException(`ไม่พบปีการศึกษารหัส ${id}`);
    return year;
  }

  async updateAcademicYear(id: string, dto: UpdateAcademicYearDto) {
    await this.findOneAcademicYear(id);
    return this.prisma.academicYear.update({ where: { id }, data: dto });
  }

  async removeAcademicYear(id: string) {
    await this.findOneAcademicYear(id);
    return this.prisma.academicYear.delete({ where: { id } });
  }

  // ── Semester ──────────────────────────────────────────────────────────────

  async createSemester(dto: CreateSemesterDto) {
    await this.findOneAcademicYear(dto.academicYearId);
    return this.prisma.semester.create({ data: dto });
  }

  async findAllSemesters(academicYearId?: string) {
    return this.prisma.semester.findMany({
      where: academicYearId ? { academicYearId } : undefined,
      include: { academicYear: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOneSemester(id: string) {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      include: { academicYear: true },
    });
    if (!semester) throw new NotFoundException(`ไม่พบภาคการศึกษารหัส ${id}`);
    return semester;
  }

  async updateSemester(id: string, dto: UpdateSemesterDto) {
    await this.findOneSemester(id);
    return this.prisma.semester.update({ where: { id }, data: dto });
  }

  async removeSemester(id: string) {
    await this.findOneSemester(id);
    return this.prisma.semester.delete({ where: { id } });
  }

  // ── Faculty ───────────────────────────────────────────────────────────────

  async createFaculty(dto: CreateFacultyDto) {
    const exists = await this.prisma.faculty.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException(`รหัสคณะ ${dto.code} มีอยู่แล้ว`);
    return this.prisma.faculty.create({ data: dto });
  }

  async findAllFaculties() {
    return this.prisma.faculty.findMany({
      include: { divisions: true, departments: true },
      orderBy: { code: 'asc' },
    });
  }

  async findOneFaculty(id: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: { divisions: true, departments: true },
    });
    if (!faculty) throw new NotFoundException(`ไม่พบคณะรหัส ${id}`);
    return faculty;
  }

  async updateFaculty(id: string, dto: UpdateFacultyDto) {
    await this.findOneFaculty(id);
    return this.prisma.faculty.update({ where: { id }, data: dto });
  }

  async removeFaculty(id: string) {
    await this.findOneFaculty(id);
    return this.prisma.faculty.delete({ where: { id } });
  }

  // ── Division ──────────────────────────────────────────────────────────────

  async createDivision(dto: CreateDivisionDto) {
    const exists = await this.prisma.division.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException(`รหัสภาควิชา ${dto.code} มีอยู่แล้ว`);
    return this.prisma.division.create({ data: dto, include: { faculty: true } });
  }

  async findAllDivisions(facultyId?: string) {
    return this.prisma.division.findMany({
      where: facultyId ? { facultyId } : undefined,
      include: { faculty: true },
      orderBy: { code: 'asc' },
    });
  }

  async findOneDivision(id: string) {
    const div = await this.prisma.division.findUnique({
      where: { id },
      include: { faculty: true },
    });
    if (!div) throw new NotFoundException(`ไม่พบภาควิชารหัส ${id}`);
    return div;
  }

  async updateDivision(id: string, dto: UpdateDivisionDto) {
    await this.findOneDivision(id);
    return this.prisma.division.update({ where: { id }, data: dto, include: { faculty: true } });
  }

  async removeDivision(id: string) {
    await this.findOneDivision(id);
    return this.prisma.division.delete({ where: { id } });
  }

  // ── Department ────────────────────────────────────────────────────────────

  async createDepartment(dto: CreateDepartmentDto) {
    const exists = await this.prisma.department.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException(`รหัสสาขา ${dto.code} มีอยู่แล้ว`);
    return this.prisma.department.create({ data: dto, include: { faculty: true, division: true } });
  }

  async findAllDepartments(facultyId?: string, divisionId?: string) {
    return this.prisma.department.findMany({
      where: {
        ...(facultyId ? { facultyId } : {}),
        ...(divisionId ? { divisionId } : {}),
      },
      include: { faculty: true, division: true },
      orderBy: { code: 'asc' },
    });
  }

  async findOneDepartment(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { faculty: true, division: true },
    });
    if (!dept) throw new NotFoundException(`ไม่พบสาขารหัส ${id}`);
    return dept;
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    await this.findOneDepartment(id);
    return this.prisma.department.update({ where: { id }, data: dto, include: { faculty: true, division: true } });
  }

  async removeDepartment(id: string) {
    await this.findOneDepartment(id);
    return this.prisma.department.delete({ where: { id } });
  }

  // ── YearLevel ─────────────────────────────────────────────────────────────

  async createYearLevel(dto: CreateYearLevelDto) {
    return this.prisma.yearLevel.create({ data: dto });
  }

  async findAllYearLevels() {
    return this.prisma.yearLevel.findMany({ orderBy: { level: 'asc' } });
  }

  async findOneYearLevel(id: string) {
    const yl = await this.prisma.yearLevel.findUnique({ where: { id } });
    if (!yl) throw new NotFoundException(`ไม่พบชั้นปีรหัส ${id}`);
    return yl;
  }

  async updateYearLevel(id: string, dto: UpdateYearLevelDto) {
    await this.findOneYearLevel(id);
    return this.prisma.yearLevel.update({ where: { id }, data: dto });
  }

  async removeYearLevel(id: string) {
    await this.findOneYearLevel(id);
    return this.prisma.yearLevel.delete({ where: { id } });
  }
}
