import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeaveRequestDto {
  @ApiPropertyOptional({ description: 'รหัส AttendanceRecord ที่ต้องการขอลา' })
  @IsOptional()
  @IsString()
  attendanceRecordId?: string;

  @ApiPropertyOptional({ description: 'รหัสตารางเรียนที่ต้องการยื่นลา (ใช้เมื่อยังไม่มี attendance record)' })
  @IsOptional()
  @IsString()
  scheduleId?: string;

  @ApiProperty({ enum: LeaveType, description: 'ประเภทการลา', example: LeaveType.SICK })
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiProperty({ description: 'เหตุผลการลา', example: 'ป่วยเป็นไข้' })
  @IsString()
  reason: string;
}

export class RejectLeaveRequestDto {
  @ApiProperty({ description: 'เหตุผลที่ปฏิเสธ' })
  @IsString()
  rejectReason: string;
}

export class UpdateLeaveRequestDto {
  @ApiProperty({ enum: LeaveType, description: 'ประเภทการลา', example: LeaveType.SICK })
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiProperty({ description: 'เหตุผลการลา', example: 'มีธุระจำเป็นต้องลา' })
  @IsString()
  reason: string;
}
