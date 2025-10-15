import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTournamentDto,
  UpdateTournamentDto,
  Tournament,
} from '@repo/types';

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTournamentDto, userId?: string): Promise<Tournament> {
    return this.prisma.tournament.create({
      data: {
        name: dto.name,
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        format: dto.format,
        userId,
      },
    }) as Promise<Tournament>;
  }

  async findAll(): Promise<Tournament[]> {
    return this.prisma.tournament.findMany({
      include: {
        matches: {
          include: {
            player1: true,
            player2: true,
            winner: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    }) as Promise<Tournament[]>;
  }

  async findOne(id: string): Promise<Tournament> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        matches: {
          include: {
            player1: true,
            player2: true,
            winner: true,
            matchScore: true,
          },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }

    return tournament as Tournament;
  }

  async update(id: string, dto: UpdateTournamentDto): Promise<Tournament> {
    try {
      const data: any = { ...dto };
      if (dto.startDate) data.startDate = new Date(dto.startDate);
      if (dto.endDate) data.endDate = new Date(dto.endDate);

      return await this.prisma.tournament.update({
        where: { id },
        data,
      }) as Promise<Tournament>;
    } catch (error) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.tournament.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }
  }
}

