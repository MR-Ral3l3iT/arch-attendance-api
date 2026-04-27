import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

// ── AcademicYear ──────────────────────────────────────────────────────────────

export class CreateAcademicYearDto {
  @ApiProperty({ description: 'ชื่อปีการศึกษา', example: '2567' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'วันเริ่มต้นปีการศึกษา', example: '2024-06-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'วันสิ้นสุดปีการศึกษา', example: '2025-05-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'ปีการศึกษาที่กำลังใช้งาน', default: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateAcademicYearDto extends PartialType(CreateAcademicYearDto) {}

// ── Semester ──────────────────────────────────────────────────────────────────

export class CreateSemesterDto {
  @ApiProperty({ description: 'ชื่อภาคการศึกษา', example: '1' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'วันเริ่มต้นภาคการศึกษา', example: '2024-06-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'วันสิ้นสุดภาคการศึกษา', example: '2024-10-31' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'รหัสปีการศึกษา' })
  @IsString()
  academicYearId: string;

  @ApiPropertyOptional({ description: 'ภาคการศึกษาที่กำลังใช้งาน', default: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSemesterDto extends PartialType(CreateSemesterDto) {}

// ── Faculty ───────────────────────────────────────────────────────────────────

export class CreateFacultyDto {
  @ApiProperty({ description: 'รหัสคณะ', example: 'ENG' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'ชื่อคณะ', example: 'คณะวิศวกรรมศาสตร์' })
  @IsString()
  name: string;
}

export class UpdateFacultyDto extends PartialType(CreateFacultyDto) {}

// ── Division ──────────────────────────────────────────────────────────────────

export class CreateDivisionDto {
  @ApiProperty({ description: 'รหัสภาควิชา', example: 'CPE' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'ชื่อภาควิชา', example: 'ภาควิชาวิศวกรรมคอมพิวเตอร์' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'รหัสคณะ' })
  @IsString()
  facultyId: string;
}

export class UpdateDivisionDto extends PartialType(CreateDivisionDto) {}

// ── Department ────────────────────────────────────────────────────────────────

export class CreateDepartmentDto {
  @ApiProperty({ description: 'รหัสสาขา', example: 'CS' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'ชื่อสาขา', example: 'วิทยาการคอมพิวเตอร์' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'รหัสคณะ' })
  @IsString()
  facultyId: string;

  @ApiPropertyOptional({ description: 'รหัสภาควิชา (ถ้ามี)' })
  @IsString()
  @IsOptional()
  divisionId?: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

// ── YearLevel ─────────────────────────────────────────────────────────────────

export class CreateYearLevelDto {
  @ApiProperty({ description: 'ชั้นปี (1-6)', example: 1 })
  @IsInt()
  @Min(1)
  @Max(6)
  level: number;

  @ApiProperty({ description: 'ชื่อชั้นปี', example: 'ชั้นปีที่ 1' })
  @IsString()
  name: string;
}

export class UpdateYearLevelDto extends PartialType(CreateYearLevelDto) {}
