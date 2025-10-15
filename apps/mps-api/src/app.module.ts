import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PlayersModule } from './players/players.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { MatchesModule } from './matches/matches.module';
import { ScoringModule } from './scoring/scoring.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PlayersModule,
    TournamentsModule,
    MatchesModule,
    ScoringModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
