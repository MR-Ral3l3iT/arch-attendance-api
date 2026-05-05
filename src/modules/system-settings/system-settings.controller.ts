import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SystemSettingsService } from './system-settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

class UpdateSystemSettingsDto {
  @ApiProperty({ description: 'เปิดรับเช็คชื่อก่อนคาบกี่นาที', example: 15 })
  @IsInt()
  @Min(0)
  @Max(60)
  @IsOptional()
  openBeforeMinutes?: number;

  @ApiProperty({
    description: 'ปิดรับเช็คชื่อหลังคาบเริ่มกี่นาที',
    example: 30,
  })
  @IsInt()
  @Min(0)
  @Max(120)
  @IsOptional()
  closeAfterMinutes?: number;

  @ApiProperty({ description: 'นับว่ามาสายหลังคาบเริ่มกี่นาที', example: 15 })
  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  lateThresholdMinutes?: number;

  @ApiProperty({ description: 'รัศมีขอบเขต GPS (เมตร)', example: 100 })
  @IsInt()
  @Min(10)
  @Max(1000)
  @IsOptional()
  gpsRadiusMeters?: number;

  @ApiProperty({ description: 'บังคับถ่ายรูป Selfie', example: true })
  @IsBoolean()
  @IsOptional()
  requireSelfie?: boolean;
}

@ApiTags('ตั้งค่าระบบ')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly service: SystemSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'ดูการตั้งค่าระบบ' })
  getSettings() {
    return this.service.getSettings();
  }

  @Put()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'อัปเดตการตั้งค่าระบบ' })
  updateSettings(@Body() dto: UpdateSystemSettingsDto) {
    return this.service.updateSettings(dto);
  }
}
