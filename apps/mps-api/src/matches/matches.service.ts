import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto, UpdateMatchDto, Match } from '@repo/types';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMatchDto): Promise<Match> {
    return this.prisma.match.create({
      data: {
        tournamentId: dto.tournamentId,
        player1Id: dto.player1Id,
        player2Id: dto.player2Id,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        bestOf: dto.bestOf || 3,
      },
      include: {
        player1: true,
        player2: true,
        tournament: true,
      },
    }) as Promise<Match>;
  }

  async findAll(): Promise<Match[]> {
    return this.prisma.match.findMany({
      include: {
        player1: true,
        player2: true,
        tournament: true,
        winner: true,
        matchScore: true,
      },
      orderBy: { scheduledAt: 'asc' },
    }) as Promise<Match[]>;
  }

  async findByTournament(tournamentId: string): Promise<Match[]> {
    return this.prisma.match.findMany({
      where: { tournamentId },
      include: {
        player1: true,
        player2: true,
        winner: true,
        matchScore: true,
      },
      orderBy: { scheduledAt: 'asc' },
    }) as Promise<Match[]>;
  }

  async findOne(id: string): Promise<Match> {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        player1: true,
        player2: true,
        tournament: true,
        winner: true,
        matchScore: true,
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return match as Match;
  }

  async update(id: string, dto: UpdateMatchDto): Promise<Match> {
    try {
      const data: any = { ...dto };
      if (dto.scheduledAt) data.scheduledAt = new Date(dto.scheduledAt);

      return await this.prisma.match.update({
        where: { id },
        data,
        include: {
          player1: true,
          player2: true,
          tournament: true,
          winner: true,
          matchScore: true,
        },
      }) as Promise<Match>;
    } catch (error) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.match.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }
  }

  async setWinner(matchId: string, winnerId: string): Promise<Match> {
    return this.prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        player1: true,
        player2: true,
        tournament: true,
        winner: true,
        matchScore: true,
      },
    }) as Promise<Match>;
  }
}

