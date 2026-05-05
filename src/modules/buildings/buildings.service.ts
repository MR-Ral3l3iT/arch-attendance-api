import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBuildingDto,
  UpdateBuildingDto,
  CreateRoomDto,
  UpdateRoomDto,
} from './dto/buildings.dto';

@Injectable()
export class BuildingsService {
  constructor(private prisma: PrismaService) {}

  async createBuilding(dto: CreateBuildingDto) {
    const exists = await this.prisma.building.findUnique({
      where: { code: dto.code },
    });
    if (exists) throw new ConflictException(`รหัสอาคาร ${dto.code} มีอยู่แล้ว`);
    return this.prisma.building.create({ data: dto });
  }

  async findAllBuildings() {
    return this.prisma.building.findMany({
      include: { rooms: true },
      orderBy: { code: 'asc' },
    });
  }

  async findOneBuilding(id: string) {
    const building = await this.prisma.building.findUnique({
      where: { id },
      include: { rooms: true },
    });
    if (!building) throw new NotFoundException(`ไม่พบอาคารรหัส ${id}`);
    return building;
  }

  async updateBuilding(id: string, dto: UpdateBuildingDto) {
    await this.findOneBuilding(id);
    return this.prisma.building.update({ where: { id }, data: dto });
  }

  async removeBuilding(id: string) {
    await this.findOneBuilding(id);
    return this.prisma.building.delete({ where: { id } });
  }

  async createRoom(dto: CreateRoomDto) {
    const exists = await this.prisma.room.findUnique({
      where: { code: dto.code },
    });
    if (exists) throw new ConflictException(`รหัสห้อง ${dto.code} มีอยู่แล้ว`);
    return this.prisma.room.create({ data: dto, include: { building: true } });
  }

  async findAllRooms(buildingId?: string) {
    return this.prisma.room.findMany({
      where: buildingId ? { buildingId } : undefined,
      include: { building: true },
      orderBy: { code: 'asc' },
    });
  }

  async findOneRoom(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { building: true },
    });
    if (!room) throw new NotFoundException(`ไม่พบห้องรหัส ${id}`);
    return room;
  }

  async updateRoom(id: string, dto: UpdateRoomDto) {
    await this.findOneRoom(id);
    return this.prisma.room.update({
      where: { id },
      data: dto,
      include: { building: true },
    });
  }

  async removeRoom(id: string) {
    await this.findOneRoom(id);
    return this.prisma.room.delete({ where: { id } });
  }
}
