import { Module } from '@nestjs/common';
import { SchedulesController, EnrollmentsController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  controllers: [SchedulesController, EnrollmentsController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
