import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';

@ApiTags('การยืนยันตัวตน')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'เข้าสู่ระบบ',
    description: 'รับ Access Token และ Refresh Token',
  })
  @ApiResponse({ status: 200, description: 'เข้าสู่ระบบสำเร็จ' })
  @ApiResponse({ status: 401, description: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
  @ApiResponse({ status: 403, description: 'อุปกรณ์ไม่ตรงกับที่ผูกไว้' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'ต่ออายุ Token',
    description: 'ใช้ Refresh Token เพื่อรับ Access Token ใหม่',
  })
  @ApiResponse({ status: 200, description: 'ได้รับ Access Token ใหม่แล้ว' })
  @ApiResponse({
    status: 401,
    description: 'Refresh Token ไม่ถูกต้องหรือหมดอายุ',
  })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'ออกจากระบบ',
    description: 'Invalidate Token ฝั่ง Client',
  })
  @ApiResponse({ status: 200, description: 'ออกจากระบบสำเร็จ' })
  logout() {
    return { message: 'ออกจากระบบสำเร็จ' };
  }
}
