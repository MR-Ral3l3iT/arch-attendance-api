import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'ชื่อผู้ใช้งาน (นศ. ใช้ email / อาจารย์+admin ใช้ username)', example: 'somying@student.ac.th' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'รหัสผ่าน (นศ. ใช้รหัสนักศึกษา)', example: '6501001' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ description: 'รหัสอุปกรณ์ (บังคับสำหรับนักศึกษา)' })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'ข้อมูลอุปกรณ์ (model, OS, version)' })
  @IsOptional()
  deviceInfo?: Record<string, unknown>;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh Token' })
  @IsString()
  refreshToken: string;
}
