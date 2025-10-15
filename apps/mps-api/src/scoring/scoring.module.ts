import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { ScoringGateway } from './scoring.gateway';
import { ScoringController } from './scoring.controller';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [MatchesModule],
  controllers: [ScoringController],
  providers: [ScoringService, ScoringGateway],
  exports: [ScoringService],
})
export class ScoringModule {}

