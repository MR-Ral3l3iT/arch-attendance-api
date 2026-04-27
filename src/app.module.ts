import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AcademicModule } from './modules/academic/academic.module';
import { BuildingsModule } from './modules/buildings/buildings.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { ProfileModule } from './modules/profile/profile.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { AttendanceSettingsModule } from './modules/attendance-settings/attendance-settings.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeaveRequestsModule } from './modules/leave-requests/leave-requests.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    AcademicModule,
    BuildingsModule,
    UsersModule,
    CoursesModule,
    EnrollmentsModule,
    ProfileModule,
    SchedulesModule,
    AttendanceSettingsModule,
    AttendanceModule,
    LeaveRequestsModule,
    AuditLogsModule,
    NotificationsModule,
    ReportsModule,
    SystemSettingsModule,
  ],
})
export class AppModule {}
