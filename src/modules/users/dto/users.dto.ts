import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

// ── Teacher ───────────────────────────────────────────────────────────────────

export class CreateTeacherDto {
  @ApiProperty({ description: 'รหัสอาจารย์', example: 'T001' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'ชื่อ', example: 'สมชาย' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'นามสกุล', example: 'ใจดี' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'ชื่อผู้ใช้งาน', example: 'teacher_t001' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'รหัสผ่าน', example: 'password123' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'อีเมล' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'เบอร์โทรศัพท์' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'รหัสคณะ' })
  @IsString()
  @IsOptional()
  facultyId?: string;

  @ApiPropertyOptional({ description: 'รหัสสาขา' })
  @IsString()
  @IsOptional()
  departmentId?: string;
}

export class UpdateTeacherDto extends PartialType(CreateTeacherDto) {}

// ── Student ───────────────────────────────────────────────────────────────────

export class CreateStudentDto {
  @ApiProperty({ description: 'รหัสนักศึกษา', example: '6501001' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'ชื่อ', example: 'สมหญิง' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'นามสกุล', example: 'มีสุข' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'อีเมล (ใช้เป็น username เข้าสู่ระบบ)', example: 'somying@student.ac.th' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'เบอร์โทรศัพท์' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'รหัสคณะ' })
  @IsString()
  @IsOptional()
  facultyId?: string;

  @ApiPropertyOptional({ description: 'รหัสสาขา' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'รหัสชั้นปี' })
  @IsString()
  @IsOptional()
  yearLevelId?: string;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}
