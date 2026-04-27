import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BuildingsService } from './buildings.service';
import {
  CreateBuildingDto, UpdateBuildingDto,
  CreateRoomDto, UpdateRoomDto,
} from './dto/buildings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('อาคารและห้องเรียน')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Post('buildings')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'สร้างอาคาร (พร้อมพิกัด GPS และรัศมี)' })
  createBuilding(@Body() dto: CreateBuildingDto) {
    return this.buildingsService.createBuilding(dto);
  }

  @Get('buildings')
  @ApiOperation({ summary: 'ดูรายการอาคารทั้งหมด' })
  findAllBuildings() {
    return this.buildingsService.findAllBuildings();
  }

  @Get('buildings/:id')
  @ApiOperation({ summary: 'ดูอาคารตาม ID' })
  findOneBuilding(@Param('id') id: string) {
    return this.buildingsService.findOneBuilding(id);
  }

  @Patch('buildings/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'แก้ไขอาคาร' })
  updateBuilding(@Param('id') id: string, @Body() dto: UpdateBuildingDto) {
    return this.buildingsService.updateBuilding(id, dto);
  }

  @Delete('buildings/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ลบอาคาร' })
  removeBuilding(@Param('id') id: string) {
    return this.buildingsService.removeBuilding(id);
  }

  @Post('rooms')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'สร้างห้องเรียน' })
  createRoom(@Body() dto: CreateRoomDto) {
    return this.buildingsService.createRoom(dto);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'ดูรายการห้องเรียน' })
  @ApiQuery({ name: 'buildingId', required: false, description: 'กรองตามอาคาร' })
  findAllRooms(@Query('buildingId') buildingId?: string) {
    return this.buildingsService.findAllRooms(buildingId);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'ดูห้องเรียนตาม ID' })
  findOneRoom(@Param('id') id: string) {
    return this.buildingsService.findOneRoom(id);
  }

  @Patch('rooms/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'แก้ไขห้องเรียน' })
  updateRoom(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.buildingsService.updateRoom(id, dto);
  }

  @Delete('rooms/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ลบห้องเรียน' })
  removeRoom(@Param('id') id: string) {
    return this.buildingsService.removeRoom(id);
  }
}
