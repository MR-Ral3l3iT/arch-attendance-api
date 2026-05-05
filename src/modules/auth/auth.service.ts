import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: { teacher: true, student: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
    }

    if (user.role === Role.STUDENT) {
      if (!dto.deviceId) {
        throw new BadRequestException('กรุณาระบุรหัสอุปกรณ์สำหรับนักศึกษา');
      }
      await this.handleDeviceBinding(
        user.student!.id,
        dto.deviceId,
        dto.deviceInfo,
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      teacherId: user.teacher?.id,
      studentId: user.student?.id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ]);

    const firstName =
      user.teacher?.firstName ??
      user.student?.firstName ??
      (user.role === Role.ADMIN ? user.username : undefined);
    const lastName = user.teacher?.lastName ?? user.student?.lastName ?? '';

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        teacherId: user.teacher?.id,
        studentId: user.student?.id,
        firstName: firstName ?? user.username,
        lastName,
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = this.jwt.verify<JwtPayload>(dto.refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Token ไม่ถูกต้อง');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        role: payload.role,
        teacherId: payload.teacherId,
        studentId: payload.studentId,
      };

      return { accessToken: await this.signAccessToken(newPayload) };
    } catch {
      throw new UnauthorizedException('Refresh Token ไม่ถูกต้องหรือหมดอายุ');
    }
  }

  private async handleDeviceBinding(
    studentId: string,
    deviceId: string,
    deviceInfo?: Record<string, unknown>,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) return;

    if (!student.deviceId) {
      // ผูก device ครั้งแรก
      await this.prisma.student.update({
        where: { id: studentId },

        data: {
          deviceId,
          deviceInfo: (deviceInfo ?? {}) as Prisma.InputJsonValue,
        },
      });
    } else if (student.deviceId !== deviceId) {
      throw new ForbiddenException(
        'อุปกรณ์นี้ไม่ตรงกับที่ผูกไว้ กรุณาติดต่อ Admin เพื่อรีเซ็ตอุปกรณ์',
      );
    }
  }

  private signAccessToken(payload: JwtPayload) {
    const expiresIn = (this.config.get<string>('JWT_EXPIRES_IN') ??
      '7d') as never;

    return this.jwt.signAsync(payload as any, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn,
    });
  }

  private signRefreshToken(payload: JwtPayload) {
    const expiresIn = (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ??
      '30d') as never;

    return this.jwt.signAsync(payload as any, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn,
    });
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}
