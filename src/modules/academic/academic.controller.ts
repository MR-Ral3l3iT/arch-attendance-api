import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Query,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AcademicService } from './academic.service';
import {
  CreateAcademicYearDto, UpdateAcademicYearDto,
  CreateSemesterDto, UpdateSemesterDto,
  CreateFacultyDto, UpdateFacultyDto,
  CreateDivisionDto, UpdateDivisionDto,
  CreateDepartmentDto, UpdateDepartmentDto,
  CreateYearLevelDto, UpdateYearLevelDto,
} from './dto/academic.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('ปีการศึกษา')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // ── AcademicYear ──────────────────────────────────────────────────────────

  @Post('academic-years')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'สร้างปีการศึกษา' })
  @ApiResponse({ status: 201, description: 'สร้างปีการศึกษาสำเร็จ' })
  createAcademicYear(@Body() dto: CreateAcademicYearDto) {
    return this.academicService.createAcademicYear(dto);
  }

  @Get('academic-years')
  @ApiOperation({ summary: 'ดูรายการปีการศึกษาทั้งหมด' })
  findAllAcademicYears() {
    return this.academicService.findAllAcademicYears();
  }

  @Get('academic-years/:id')
  @ApiOperation({ summary: 'ดูปีการศึกษาตาม ID' })
  findOneAcademicYear(@Param('id') id: string) {
    return this.academicService.findOneAcademicYear(id);
  }

  @Patch('academic-years/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'แก้ไขปีการศึกษา' })
  updateAcademicYear(@Param('id') id: string, @Body() dto: UpdateAcademicYearDto) {
    return this.academicService.updateAcademicYear(id, dto);
  }

  @Delete('academic-years/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ลบปีการศึกษา' })
  removeAcademicYear(@Param('id') id: string) {
    return this.academicService.removeAcademicYear(id);
  }

  // ── Semester ──────────────────────────────────────────────────────────────

  @Post('semesters')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'สร้างภาคการศึกษา' })
  createSemester(@Body() dto: CreateSemesterDto) {
    return this.academicService.createSemester(dto);
  }

  @Get('semesters')
  @ApiOperation({ summary: 'ดูรายการภาคการศึกษา' })
  @ApiQuery({ name: 'academicYearId', required: false, description: 'กรองตามปีการศึกษา' })
  findAllSemesters(@Query('academicYearId') academicYearId?: string) {
    return this.academicService.findAllSemesters(academicYearId);
  }

  @Get('semesters/:id')
  @ApiOperation({ summary: 'ดูภาคการศึกษาตาม ID' })
  findOneSemester(@Param('id') id: string) {
    return this.academicService.findOneSemester(id);
  }

  @Patch('semesters/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'แก้ไขภาคการศึกษา' })
  updateSemester(@Param('id') id: string, @Body() dto: UpdateSemesterDto) {
    return this.academicService.updateSemester(id, dto);
  }

  @Delete('semesters/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ลบภาคการศึกษา' })
  removeSemester(@Param('id') id: string) {
    return this.academicService.removeSemester(id);
  }

  // ── Faculty ───────────────────────────────────────────────────────────────

  @Post('faculties')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'สร้างคณะ' })
  createFaculty(@Body() dto: CreateFacultyDto) {
    return this.academicService.createFaculty(dto);
  }

  @Get('faculties')
  @ApiOperation({ summary: 'ดูรายการคณะทั้งหมด' })
  findAllFaculties() {
    return this.academicService.findAllFaculties();
  }

  @Get('faculties/:id')
  @ApiOperation({ summary: 'ดูคณะตาม ID' })
  findOneFaculty(@Param('id') id: string) {
    return this.academicService.findOneFaculty(id);
  }

  @Patch('faculties/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'แก้ไขคณะ' })
  updateFaculty(@Param('id') id: string, @Body() dto: UpdateFacultyDto) {
    return this.academicService.updateFaculty(id, dto);
  }

  @Delete('faculties/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ลบคณะ' })
  removeFaculty(@Param('id') id: string) {
    return this.academicService.removeFaculty(id);
  }

  // ── Division ──────────────────────────────────────────────────────────────

  @Post('divisions')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'สร้างภาควิชา' })
  createDivision(@Body() dto: CreateDivisionDto) {
    return this.academicService.createDivision(dto);
  }

  @Get('divisions')
  @ApiOperation({ summary: 'ดูรายการภาควิชาทั้งหมด' })
  @ApiQuery({ name: 'facultyId', required: false, description: 'กรองตามคณะ' })
  findAllDivisions(@Query('facultyId') facultyId?: string) {
    return this.academicService.findAllDivisions(facultyId);
  }

  @Get('divisions/:id')
  @ApiOperation({ summary: 'ดูภาควิชาตาม ID' })
  findOneDivision(@Param('id') id: string) {
    return this.academicService.findOneDivision(id);
  }

  @Patch('divisions/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'แก้ไขภาควิชา' })
  updateDivision(@Param('id') id: string, @Body() dto: UpdateDivisionDto) {
    return this.academicService.updateDivision(id, dto);
  }

  @Delete('divisions/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ลบภาควิชา' })
  removeDivision(@Param('id') id: string) {
    return this.academicService.removeDivision(id);
  }

  // ── Department ────────────────────────────────────────────────────────────

  @Post('departments')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'สร้างสาขา' })
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.academicService.createDepartment(dto);
  }

  @Get('departments')
  @ApiOperation({ summary: 'ดูรายการสาขา' })
  @ApiQuery({ name: 'facultyId', required: false, description: 'กรองตามคณะ' })
  @ApiQuery({ name: 'divisionId', required: false, description: 'กรองตามภาควิชา' })
  findAllDepartments(@Query('facultyId') facultyId?: string, @Query('divisionId') divisionId?: string) {
    return this.academicService.findAllDepartments(facultyId, divisionId);
  }

  @Get('departments/:id')
  @ApiOperation({ summary: 'ดูสาขาตาม ID' })
  findOneDepartment(@Param('id') id: string) {
    return this.academicService.findOneDepartment(id);
  }

  @Patch('departments/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'แก้ไขสาขา' })
  updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.academicService.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ลบสาขา' })
  removeDepartment(@Param('id') id: string) {
    return this.academicService.removeDepartment(id);
  }

  // ── YearLevel ─────────────────────────────────────────────────────────────

  @Post('year-levels')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'สร้างชั้นปี' })
  createYearLevel(@Body() dto: CreateYearLevelDto) {
    return this.academicService.createYearLevel(dto);
  }

  @Get('year-levels')
  @ApiOperation({ summary: 'ดูชั้นปีทั้งหมด' })
  findAllYearLevels() {
    return this.academicService.findAllYearLevels();
  }

  @Get('year-levels/:id')
  @ApiOperation({ summary: 'ดูชั้นปีตาม ID' })
  findOneYearLevel(@Param('id') id: string) {
    return this.academicService.findOneYearLevel(id);
  }

  @Patch('year-levels/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'แก้ไขชั้นปี' })
  updateYearLevel(@Param('id') id: string, @Body() dto: UpdateYearLevelDto) {
    return this.academicService.updateYearLevel(id, dto);
  }

  @Delete('year-levels/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ลบชั้นปี' })
  removeYearLevel(@Param('id') id: string) {
    return this.academicService.removeYearLevel(id);
  }
}
