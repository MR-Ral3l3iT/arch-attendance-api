import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const ANNOUNCEMENT_TYPES = [
  'GENERAL',
  'CANCEL_CLASS',
  'EXAM',
  'RESCHEDULE',
] as const;
export type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number];

export class SendPushNotificationDto {
  @ApiProperty({ example: '<FCM_TOKEN>' })
  @IsString()
  @MinLength(20)
  fcmToken!: string;

  @ApiProperty({ example: 'แจ้งเตือนทดสอบ' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'ทดสอบส่งข้อความจาก backend' })
  @IsString()
  body!: string;

  @ApiPropertyOptional({ example: { screen: 'leave-requests', type: 'TEST' } })
  @IsOptional()
  @IsObject()
  data?: Record<string, string>;
}

export class AnnounceToSectionDto {
  @ApiProperty({
    example: 'clxxx...',
    description: 'ID ของกลุ่มเรียน (Section)',
  })
  @IsString()
  sectionId!: string;

  @ApiProperty({ example: 'วันนี้ยกคลาส' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'อาจารย์ติดธุระ คาบวันนี้ยกเลิก พบกันคาบหน้า' })
  @IsString()
  body!: string;

  @ApiPropertyOptional({
    description: 'ประเภทประกาศ',
    enum: ANNOUNCEMENT_TYPES,
    default: 'GENERAL',
  })
  @IsOptional()
  @IsIn(ANNOUNCEMENT_TYPES)
  type?: AnnouncementType;

  @ApiPropertyOptional({
    example: 'clxxx...',
    description: 'scheduleId (ใช้เมื่อ type = CANCEL_CLASS)',
  })
  @IsOptional()
  @IsString()
  scheduleId?: string;

  @ApiPropertyOptional({
    example: '2026-05-08',
    description: 'classDate (YYYY-MM-DD) ใช้เมื่อ type = CANCEL_CLASS',
  })
  @IsOptional()
  @IsDateString()
  classDate?: string;
}

export class RegisterFcmTokenDto {
  @ApiProperty({ example: '<FCM_TOKEN>' })
  @IsString()
  @MinLength(20)
  fcmToken!: string;
}
