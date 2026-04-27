import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class CheckInDto {
  @ApiProperty({ description: 'รหัสตารางเรียน' })
  @IsString()
  scheduleId: string;

  @ApiProperty({ description: 'วันที่คาบเรียน (YYYY-MM-DD)', example: '2024-09-02' })
  @IsDateString()
  classDate: string;

  @ApiProperty({ description: 'ละติจูดปัจจุบัน', example: 13.7563 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'ลองจิจูดปัจจุบัน', example: 100.5018 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ description: 'รหัสอุปกรณ์' })
  @IsString()
  deviceId: string;

  @ApiPropertyOptional({ description: 'ข้อมูลอุปกรณ์' })
  @IsOptional()
  deviceInfo?: Record<string, unknown>;
}

export class TeacherMarkDto {
  @ApiProperty({ description: 'รหัสนักศึกษา' })
  @IsString()
  studentId: string;

  @ApiProperty({ description: 'รหัสตารางเรียน' })
  @IsString()
  scheduleId: string;

  @ApiProperty({ description: 'วันที่คาบ (YYYY-MM-DD)' })
  @IsDateString()
  classDate: string;

  @ApiProperty({ enum: AttendanceStatus, description: 'สถานะ' })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

export class UpdateAttendanceStatusDto {
  @ApiProperty({ description: 'สถานะใหม่', enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({ description: 'เหตุผลในการแก้ไข (บังคับ)' })
  @IsString()
  reason: string;
}
