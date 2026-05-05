import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotificationsService } from './notifications.service';
import { SendPushNotificationDto, AnnounceToSectionDto, RegisterFcmTokenDto } from './dto/notifications.dto';

@ApiTags('แจ้งเตือน')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('my')
  @ApiOperation({ summary: 'ดูรายการแจ้งเตือนของผู้ใช้ปัจจุบัน' })
  getMyNotifications(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUserNotifications(user.sub);
  }

  @Get('my/unread-count')
  @ApiOperation({ summary: 'ดูจำนวนการแจ้งเตือนที่ยังไม่อ่าน' })
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    const count = await this.notificationsService.getUnreadCount(user.sub);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'ทำเครื่องหมายว่าอ่านแล้ว (รายรายการ)' })
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.notificationsService.markAsRead(user.sub, id);
    return { success: true };
  }

  @Patch('my/read-all')
  @ApiOperation({ summary: 'ทำเครื่องหมายว่าอ่านแล้วทั้งหมด' })
  async markAllRead(@CurrentUser() user: JwtPayload) {
    await this.notificationsService.markAllAsRead(user.sub);
    return { success: true };
  }

  @Post('send')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'ทดสอบส่ง Push Notification ไปยัง FCM token' })
  async sendPush(@Body() dto: SendPushNotificationDto) {
    return this.notificationsService.sendPushNotification(
      dto.fcmToken,
      dto.title,
      dto.body,
      dto.data,
    );
  }

  @Post('announce')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'อาจารย์ส่งประกาศถึงนักศึกษาทุกคนในกลุ่มเรียน' })
  async announce(@Body() dto: AnnounceToSectionDto) {
    return this.notificationsService.announceToSection(dto.sectionId, dto.title, dto.body);
  }

  @Post('register-token')
  @ApiOperation({ summary: 'ผูก FCM token กับผู้ใช้ปัจจุบัน' })
  async registerToken(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterFcmTokenDto,
  ) {
    return this.notificationsService.registerFcmToken(user.sub, dto.fcmToken);
  }
}
