import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, Matches, IsOptional } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class CreateScheduleDto {
  @ApiProperty({ description: 'วันสอน', enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ description: 'เวลาเริ่ม (HH:MM)', example: '08:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'รูปแบบเวลาต้องเป็น HH:MM' })
  startTime: string;

  @ApiProperty({ description: 'เวลาสิ้นสุด (HH:MM)', example: '11:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'รูปแบบเวลาต้องเป็น HH:MM' })
  endTime: string;

  @ApiProperty({ description: 'รหัสกลุ่มเรียน' })
  @IsString()
  sectionId: string;

  @ApiProperty({ description: 'รหัสห้องเรียน' })
  @IsString()
  roomId: string;

  @ApiProperty({ description: 'รหัสอาจารย์' })
  @IsString()
  teacherId: string;

  @ApiProperty({ description: 'รหัสภาคการศึกษา' })
  @IsString()
  semesterId: string;
}

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}

export class CreateEnrollmentDto {
  @ApiProperty({ description: 'รหัสนักศึกษา' })
  @IsString()
  studentId: string;

  @ApiProperty({ description: 'รหัสกลุ่มเรียน' })
  @IsString()
  sectionId: string;
}

export class BulkEnrollmentDto {
  @ApiProperty({ description: 'รายการรหัสนักศึกษา', type: [String] })
  studentIds: string[];

  @ApiProperty({ description: 'รหัสกลุ่มเรียน' })
  @IsString()
  sectionId: string;
}
