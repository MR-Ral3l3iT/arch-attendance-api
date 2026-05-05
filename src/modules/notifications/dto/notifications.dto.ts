import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

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
  @ApiProperty({ example: 'clxxx...', description: 'ID ของกลุ่มเรียน (Section)' })
  @IsString()
  sectionId!: string;

  @ApiProperty({ example: 'วันนี้ยกคลาส' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'อาจารย์ติดธุระ คาบวันนี้ยกเลิก พบกันคาบหน้า' })
  @IsString()
  body!: string;
}

export class RegisterFcmTokenDto {
  @ApiProperty({ example: '<FCM_TOKEN>' })
  @IsString()
  @MinLength(20)
  fcmToken!: string;
}
