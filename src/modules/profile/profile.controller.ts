import {
  Controller, Get, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProfileService } from './profile.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('โปรไฟล์')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'ข้อมูลโปรไฟล์ของผู้ใช้ปัจจุบัน' })
  getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.profileService.getMyProfile(user);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'อัปโหลดรูปโปรไฟล์ของตัวเอง (อาจารย์ / นักศึกษา)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary', description: 'ไฟล์รูปภาพ (jpg, png, webp) สูงสุด 5MB' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (jpg, png, webp)'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) throw new BadRequestException('กรุณาเลือกไฟล์รูปภาพ');
    return this.profileService.updateAvatar(user, file);
  }
}
