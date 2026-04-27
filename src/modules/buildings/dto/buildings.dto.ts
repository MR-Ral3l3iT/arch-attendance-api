import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateBuildingDto {
  @ApiProperty({ description: 'รหัสอาคาร', example: 'B01' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'ชื่ออาคาร', example: 'อาคารวิศวกรรม 1' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'ละติจูด', example: 13.7563 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'ลองจิจูด', example: 100.5018 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ description: 'รัศมีขอบเขต (เมตร)', example: 100, default: 100 })
  @IsNumber()
  @Min(10)
  @Max(500)
  @IsOptional()
  radiusMeters?: number;
}

export class UpdateBuildingDto extends PartialType(CreateBuildingDto) {}

export class CreateRoomDto {
  @ApiProperty({ description: 'รหัสห้อง', example: 'B01-101' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'ชื่อห้อง', example: 'ห้อง 101' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'ความจุ (คน)', example: 40 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @ApiProperty({ description: 'รหัสอาคาร' })
  @IsString()
  buildingId: string;
}

export class UpdateRoomDto extends PartialType(CreateRoomDto) {}
