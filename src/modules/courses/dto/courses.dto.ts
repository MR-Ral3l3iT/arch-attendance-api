import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ description: 'รหัสวิชา', example: 'CS101' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'ชื่อวิชา', example: 'การเขียนโปรแกรมคอมพิวเตอร์' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'จำนวนหน่วยกิต', example: 3, default: 3 })
  @IsInt()
  @Min(1)
  @IsOptional()
  credits?: number;

  @ApiPropertyOptional({ description: 'รหัสคณะ' })
  @IsString()
  @IsOptional()
  facultyId?: string;

  @ApiPropertyOptional({ description: 'รหัสสาขา' })
  @IsString()
  @IsOptional()
  departmentId?: string;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class CreateSectionDto {
  @ApiProperty({ description: 'ชื่อกลุ่มเรียน', example: 'กลุ่ม 1' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'รหัสวิชา' })
  @IsString()
  courseId: string;

  @ApiProperty({ description: 'รหัสภาคการศึกษา' })
  @IsString()
  semesterId: string;

  @ApiPropertyOptional({ description: 'รหัสชั้นปี (ใช้กรองนักศึกษาตอนผูกเข้ากลุ่ม)' })
  @IsString()
  @IsOptional()
  yearLevelId?: string;

  @ApiPropertyOptional({ description: 'จำนวนนักศึกษาสูงสุด' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxStudents?: number;
}

export class UpdateSectionDto extends PartialType(CreateSectionDto) {}
