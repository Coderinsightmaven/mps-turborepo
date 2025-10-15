import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('scoring')
@UseGuards(JwtAuthGuard)
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post(':matchId/initialize')
  async initializeScore(@Param('matchId') matchId: string) {
    return this.scoringService.initializeMatchScore(matchId);
  }

  @Get(':matchId')
  async getScore(@Param('matchId') matchId: string) {
    return this.scoringService.getScore(matchId);
  }

  @Post(':matchId/score')
  async scorePoint(
    @Param('matchId') matchId: string,
    @Body() body: { pointWinner: 1 | 2 },
  ) {
    return this.scoringService.scorePoint(matchId, body.pointWinner);
  }

  @Post(':matchId/undo')
  async undoPoint(@Param('matchId') matchId: string) {
    return this.scoringService.undoPoint(matchId);
  }
}

