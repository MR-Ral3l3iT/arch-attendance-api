import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto, CreateSectionDto, UpdateSectionDto } from './dto/courses.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async createCourse(dto: CreateCourseDto) {
    const exists = await this.prisma.course.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException(`รหัสวิชา ${dto.code} มีอยู่แล้ว`);
    return this.prisma.course.create({ data: dto });
  }

  async findAllCourses(departmentId?: string) {
    return this.prisma.course.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: { faculty: true, department: true, sections: true },
      orderBy: { code: 'asc' },
    });
  }

  async findOneCourse(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { faculty: true, department: true, sections: { include: { schedules: true } } },
    });
    if (!course) throw new NotFoundException(`ไม่พบรายวิชารหัส ${id}`);
    return course;
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    await this.findOneCourse(id);
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async removeCourse(id: string) {
    await this.findOneCourse(id);
    return this.prisma.course.delete({ where: { id } });
  }

  private sectionInclude = {
    course: { include: { department: true } },
    semester: { include: { academicYear: true } },
    yearLevel: true,
  } as const;

  async createSection(dto: CreateSectionDto) {
    return this.prisma.section.create({
      data: dto,
      include: this.sectionInclude,
    });
  }

  async findAllSections(courseId?: string) {
    return this.prisma.section.findMany({
      where: courseId ? { courseId } : undefined,
      include: this.sectionInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findOneSection(id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        ...this.sectionInclude,
        schedules: true,
        enrollments: {
          include: {
            student: { include: { department: true, yearLevel: true } },
          },
          orderBy: { student: { code: 'asc' } },
        },
      },
    });
    if (!section) throw new NotFoundException(`ไม่พบกลุ่มเรียนรหัส ${id}`);
    return section;
  }

  async updateSection(id: string, dto: UpdateSectionDto) {
    await this.findOneSection(id);
    return this.prisma.section.update({
      where: { id }, data: dto,
      include: this.sectionInclude,
    });
  }

  async removeSection(id: string) {
    await this.findOneSection(id);
    return this.prisma.section.delete({ where: { id } });
  }
}
