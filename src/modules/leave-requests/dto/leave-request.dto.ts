import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeaveRequestDto {
  @ApiProperty({ description: 'รหัส AttendanceRecord ที่ต้องการขอลา' })
  @IsString()
  attendanceRecordId: string;

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
