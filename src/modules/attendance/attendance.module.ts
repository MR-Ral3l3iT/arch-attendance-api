import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceSettingsModule } from '../attendance-settings/attendance-settings.module';

@Module({
  imports: [
    MulterModule.register({ dest: './uploads/selfies' }),
    AttendanceSettingsModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
