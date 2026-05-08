import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Query,
  Post,
  Delete,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SystemSettingsService } from './system-settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

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

class CreateHolidayDto {
  @ApiProperty({ description: 'รหัสภาคการศึกษา' })
  @IsString()
  semesterId!: string;

  @ApiProperty({ description: 'วันที่หยุด (YYYY-MM-DD)', example: '2026-12-05' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'ชื่อวันหยุด', example: 'วันพ่อแห่งชาติ' })
  @IsString()
  name!: string;
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

  @Get('holidays')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ดูรายการวันหยุดตามภาคการศึกษา' })
  getHolidays(@Query('semesterId') semesterId: string) {
    return this.service.getHolidays(semesterId);
  }

  @Post('holidays')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'เพิ่มวันหยุด' })
  createHoliday(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateHolidayDto,
  ) {
    return this.service.createHoliday({
      ...dto,
      createdById: user.sub,
    });
  }

  @Delete('holidays/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ลบวันหยุด' })
  deleteHoliday(@Param('id') id: string) {
    return this.service.deleteHoliday(id);
  }
}
