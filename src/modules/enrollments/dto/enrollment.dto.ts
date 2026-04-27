import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ description: 'รหัสนักศึกษา (Student.id)' })
  @IsString()
  studentId: string;

  @ApiProperty({ description: 'รหัสกลุ่มเรียน (Section.id)' })
  @IsString()
  sectionId: string;
}
