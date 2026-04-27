import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Query, UploadedFile, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiQuery,
  ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateTeacherDto, UpdateTeacherDto, CreateStudentDto, UpdateStudentDto } from './dto/users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('อาจารย์')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'เพิ่มอาจารย์' })
  create(@Body() dto: CreateTeacherDto) {
    return this.usersService.createTeacher(dto);
  }

  @Post('bulk-import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'นำเข้าข้อมูลอาจารย์ทีละมาก (CSV/JSON)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'ไฟล์ CSV หรือ JSON รายชื่ออาจารย์' })
  async bulkImport(@UploadedFile() _file: Express.Multer.File, @Body() body: { data: string }) {
    const rows: CreateTeacherDto[] = JSON.parse(body.data);
    return this.usersService.bulkImportTeachers(rows);
  }

  @Get()
  @ApiOperation({ summary: 'ดูรายการอาจารย์ทั้งหมด' })
  @ApiQuery({ name: 'facultyId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'isActive', required: false, description: 'true | false' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('facultyId') facultyId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAllTeachers(
      facultyId, departmentId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูอาจารย์ตาม ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOneTeacher(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลอาจารย์' })
  update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.usersService.updateTeacher(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบอาจารย์' })
  remove(@Param('id') id: string) {
    return this.usersService.removeTeacher(id);
  }
}

@ApiTags('นักศึกษา')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('students')
export class StudentsController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'เพิ่มนักศึกษา' })
  create(@Body() dto: CreateStudentDto) {
    return this.usersService.createStudent(dto);
  }

  @Post('bulk-import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'นำเข้าข้อมูลนักศึกษาทีละมาก (CSV/JSON)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'ไฟล์ CSV หรือ JSON รายชื่อนักศึกษา' })
  async bulkImport(@UploadedFile() _file: Express.Multer.File, @Body() body: { data: string }) {
    const rows: CreateStudentDto[] = JSON.parse(body.data);
    return this.usersService.bulkImportStudents(rows);
  }

  @Get()
  @ApiOperation({ summary: 'ดูรายการนักศึกษาทั้งหมด' })
  @ApiQuery({ name: 'facultyId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'yearLevelId', required: false })
  @ApiQuery({ name: 'isActive', required: false, description: 'true | false' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('facultyId') facultyId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('yearLevelId') yearLevelId?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAllStudents({
      facultyId, departmentId, yearLevelId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูนักศึกษาตาม ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOneStudent(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลนักศึกษา' })
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.usersService.updateStudent(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบนักศึกษา' })
  remove(@Param('id') id: string) {
    return this.usersService.removeStudent(id);
  }

  @Patch(':id/device/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'รีเซ็ต Device Binding ของนักศึกษา (Admin เท่านั้น)' })
  resetDevice(@Param('id') id: string) {
    return this.usersService.resetDeviceBinding(id);
  }
}
