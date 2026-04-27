import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TeachersController, StudentsController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [MulterModule.register({ dest: './uploads/imports' })],
  controllers: [TeachersController, StudentsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
