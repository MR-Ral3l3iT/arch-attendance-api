import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded files (profile images, etc.)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) || ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('ระบบเช็คชื่อนักศึกษา — API')
    .setDescription('API สำหรับระบบเช็คชื่อนักศึกษาด้วย GPS และ Selfie')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addTag('การยืนยันตัวตน', 'Login, Logout, Refresh Token')
    .addTag('โปรไฟล์', 'อัปโหลดรูปโปรไฟล์')
    .addTag('ปีการศึกษา', 'จัดการปีการศึกษาและภาคการศึกษา')
    .addTag('คณะและสาขา', 'จัดการคณะ สาขา และชั้นปี')
    .addTag('อาคารและห้องเรียน', 'จัดการอาคาร ห้องเรียน และพิกัด GPS')
    .addTag('อาจารย์', 'จัดการข้อมูลอาจารย์')
    .addTag('นักศึกษา', 'จัดการข้อมูลนักศึกษา')
    .addTag('รายวิชา', 'จัดการรายวิชาและกลุ่มเรียน')
    .addTag('ตารางเรียน', 'จัดการตารางเรียน')
    .addTag('การลงทะเบียนเรียน', 'ผูกนักศึกษากับกลุ่มเรียน')
    .addTag('เงื่อนไขเช็คชื่อ', 'ตั้งค่าเงื่อนไขเช็คชื่อ')
    .addTag('เช็คชื่อ', 'บันทึกและดูสถานะการเข้าเรียน')
    .addTag('คำขอลา', 'ยื่นและอนุมัติคำขอลา')
    .addTag('การแจ้งเตือน', 'Push Notification')
    .addTag('รายงาน', 'Export รายงานการเข้าเรียน')
    .addTag('ประวัติการแก้ไข', 'Audit Log ทุกการเปลี่ยนแปลงสถานะ')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API กำลังทำงานที่: http://localhost:${port}`);
  console.log(`🌐 API (LAN): http://<your-mac-ip>:${port}`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
}
void bootstrap();
