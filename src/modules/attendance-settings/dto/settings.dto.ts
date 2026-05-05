import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpsertAttendanceSettingsDto {
  @ApiPropertyOptional({
    description: 'เปิดให้เช็คชื่อก่อนคาบกี่นาที',
    example: 15,
    default: 15,
  })
  @IsInt()
  @Min(0)
  @Max(60)
  @IsOptional()
  openBeforeMinutes?: number;

  @ApiPropertyOptional({
    description: 'ปิดรับเช็คชื่อหลังคาบเริ่มกี่นาที',
    example: 30,
    default: 30,
  })
  @IsInt()
  @Min(0)
  @Max(120)
  @IsOptional()
  closeAfterMinutes?: number;

  @ApiPropertyOptional({
    description: 'นับว่ามาสายหลังคาบเริ่มกี่นาที',
    example: 15,
    default: 15,
  })
  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  lateAfterMinutes?: number;

  @ApiPropertyOptional({
    description: 'นับว่าขาดเรียนหลังคาบเริ่มกี่นาที',
    example: 30,
    default: 30,
  })
  @IsInt()
  @Min(1)
  @Max(120)
  @IsOptional()
  absentAfterMinutes?: number;
}
