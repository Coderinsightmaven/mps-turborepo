import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto, UpdatePlayerDto, Player } from '@repo/types';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePlayerDto): Promise<Player> {
    return this.prisma.player.create({
      data: {
        name: dto.name,
        ranking: dto.ranking,
        country: dto.country,
      },
    }) as Promise<Player>;
  }

  async findAll(): Promise<Player[]> {
    return this.prisma.player.findMany({
      orderBy: { ranking: 'asc' },
    }) as Promise<Player[]>;
  }

  async findOne(id: string): Promise<Player> {
    const player = await this.prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return player as Player;
  }

  async update(id: string, dto: UpdatePlayerDto): Promise<Player> {
    try {
      return await this.prisma.player.update({
        where: { id },
        data: dto,
      }) as Promise<Player>;
    } catch (error) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.player.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }
  }

  async updateStats(playerId: string, stats: any): Promise<Player> {
    return this.prisma.player.update({
      where: { id: playerId },
      data: { stats },
    }) as Promise<Player>;
  }
}

