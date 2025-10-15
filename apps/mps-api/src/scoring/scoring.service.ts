import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MatchScore,
  TennisPoint,
  SetScore,
  PointHistory,
} from '@repo/types';

@Injectable()
export class ScoringService {
  constructor(private prisma: PrismaService) {}

  /**
   * Initialize a new match score
   */
  async initializeMatchScore(matchId: string): Promise<MatchScore> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new BadRequestException('Match not found');
    }

    // Check if score already exists
    const existingScore = await this.prisma.matchScore.findUnique({
      where: { matchId },
    });

    if (existingScore) {
      return existingScore as MatchScore;
    }

    const initialScore = await this.prisma.matchScore.create({
      data: {
        matchId,
        currentSet: 1,
        sets: [],
        games: [0, 0],
        points: [0, 0],
        server: 1,
        inTiebreak: false,
        history: [],
      },
    });

    // Update match status to IN_PROGRESS
    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    return initialScore as MatchScore;
  }

  /**
   * Score a point for a player
   */
  async scorePoint(matchId: string, pointWinner: 1 | 2): Promise<MatchScore> {
    const score = await this.prisma.matchScore.findUnique({
      where: { matchId },
    });

    if (!score) {
      throw new BadRequestException('Match score not found');
    }

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new BadRequestException('Match not found');
    }

    // Parse current score
    const sets = score.sets as any[];
    const games = score.games as [number, number];
    const points = score.points as [TennisPoint, TennisPoint];
    const history = score.history as PointHistory[];

    let newSets = [...sets];
    let newGames: [number, number] = [...games];
    let newPoints: [TennisPoint, TennisPoint] = [...points];
    let newCurrentSet = score.currentSet;
    let newInTiebreak = score.inTiebreak;
    let newTiebreakPoints = score.tiebreakPoints as [number, number] | null;
    let winnerId: string | null = null;

    if (newInTiebreak) {
      // Tiebreak scoring
      newTiebreakPoints = newTiebreakPoints || [0, 0];
      newTiebreakPoints[pointWinner - 1]++;

      const p1 = newTiebreakPoints[0];
      const p2 = newTiebreakPoints[1];

      // Check if tiebreak is won (first to 7 with 2 point lead)
      if ((p1 >= 7 || p2 >= 7) && Math.abs(p1 - p2) >= 2) {
        newGames[pointWinner - 1]++;
        const setWinner = pointWinner;

        // Add completed set
        newSets.push({
          setNumber: newCurrentSet,
          player1Games: newGames[0],
          player2Games: newGames[1],
          player1TiebreakPoints: newTiebreakPoints[0],
          player2TiebreakPoints: newTiebreakPoints[1],
          winnerId: setWinner === 1 ? match.player1Id : match.player2Id,
        });

        // Check if match is won
        const setsWon = this.countSetsWon(newSets, match.player1Id, match.player2Id);
        const setsToWin = Math.ceil(match.bestOf / 2);

        if (setsWon[0] >= setsToWin) {
          winnerId = match.player1Id;
        } else if (setsWon[1] >= setsToWin) {
          winnerId = match.player2Id;
        } else {
          // Start new set
          newCurrentSet++;
          newGames = [0, 0];
          newPoints = [0, 0];
          newInTiebreak = false;
          newTiebreakPoints = null;
        }
      }
    } else {
      // Regular point scoring
      newPoints = this.advancePoint(newPoints, pointWinner);

      // Check if game is won
      if (this.isGameWon(newPoints)) {
        newGames[pointWinner - 1]++;
        newPoints = [0, 0];

        // Check if set is won or tiebreak should start
        const g1 = newGames[0];
        const g2 = newGames[1];

        if (g1 === 6 && g2 === 6) {
          // Start tiebreak
          newInTiebreak = true;
          newTiebreakPoints = [0, 0];
        } else if ((g1 >= 6 || g2 >= 6) && Math.abs(g1 - g2) >= 2) {
          // Set is won
          const setWinner = g1 > g2 ? 1 : 2;
          newSets.push({
            setNumber: newCurrentSet,
            player1Games: g1,
            player2Games: g2,
            winnerId: setWinner === 1 ? match.player1Id : match.player2Id,
          });

          // Check if match is won
          const setsWon = this.countSetsWon(newSets, match.player1Id, match.player2Id);
          const setsToWin = Math.ceil(match.bestOf / 2);

          if (setsWon[0] >= setsToWin) {
            winnerId = match.player1Id;
          } else if (setsWon[1] >= setsToWin) {
            winnerId = match.player2Id;
          } else {
            // Start new set
            newCurrentSet++;
            newGames = [0, 0];
          }
        }
      }
    }

    // Add to history
    const newHistory = [
      ...history,
      {
        timestamp: new Date(),
        pointWinner,
        score: {
          sets: newSets,
          games: newGames,
          points: newPoints,
        },
      },
    ];

    // Update score in database
    const updatedScore = await this.prisma.matchScore.update({
      where: { matchId },
      data: {
        currentSet: newCurrentSet,
        sets: newSets,
        games: newGames,
        points: newPoints,
        inTiebreak: newInTiebreak,
        tiebreakPoints: newTiebreakPoints,
        history: newHistory,
        winnerId: winnerId || undefined,
      },
    });

    // If match is won, update match
    if (winnerId) {
      await this.prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          winnerId,
        },
      });

      // Update player stats
      await this.updatePlayerStats(match.player1Id, match.player2Id, winnerId);
    }

    return updatedScore as MatchScore;
  }

  /**
   * Undo the last point
   */
  async undoPoint(matchId: string): Promise<MatchScore> {
    const score = await this.prisma.matchScore.findUnique({
      where: { matchId },
    });

    if (!score) {
      throw new BadRequestException('Match score not found');
    }

    const history = score.history as PointHistory[];

    if (history.length === 0) {
      throw new BadRequestException('No points to undo');
    }

    // Get previous state
    if (history.length === 1) {
      // Reset to initial state
      return this.prisma.matchScore.update({
        where: { matchId },
        data: {
          currentSet: 1,
          sets: [],
          games: [0, 0],
          points: [0, 0],
          inTiebreak: false,
          tiebreakPoints: null,
          history: [],
          winnerId: null,
        },
      }) as Promise<MatchScore>;
    }

    const previousState = history[history.length - 2];
    const newHistory = history.slice(0, -1);

    return this.prisma.matchScore.update({
      where: { matchId },
      data: {
        sets: previousState.score.sets,
        games: previousState.score.games,
        points: previousState.score.points,
        history: newHistory,
        winnerId: null,
      },
    }) as Promise<MatchScore>;
  }

  /**
   * Get current match score
   */
  async getScore(matchId: string): Promise<MatchScore | null> {
    const score = await this.prisma.matchScore.findUnique({
      where: { matchId },
    });
    return score as MatchScore | null;
  }

  // Helper methods

  private advancePoint(
    points: [TennisPoint, TennisPoint],
    winner: 1 | 2,
  ): [TennisPoint, TennisPoint] {
    const newPoints: [TennisPoint, TennisPoint] = [...points];
    const loser = winner === 1 ? 2 : 1;

    // Handle deuce and advantage
    if (points[0] === 40 && points[1] === 40) {
      // Deuce
      newPoints[winner - 1] = 'AD';
    } else if (points[winner - 1] === 'AD') {
      // Winner has advantage, wins game
      return newPoints; // Game is won
    } else if (points[loser - 1] === 'AD') {
      // Loser has advantage, back to deuce
      newPoints[loser - 1] = 40;
    } else {
      // Regular point progression
      const currentPoint = points[winner - 1];
      if (currentPoint === 0) newPoints[winner - 1] = 15;
      else if (currentPoint === 15) newPoints[winner - 1] = 30;
      else if (currentPoint === 30) newPoints[winner - 1] = 40;
    }

    return newPoints;
  }

  private isGameWon(points: [TennisPoint, TennisPoint]): boolean {
    const [p1, p2] = points;
    // Game is won if one player has 40 and the other doesn't have 40 or AD
    if (p1 === 'AD' || p2 === 'AD') return true;
    if (p1 === 40 && p2 !== 40 && p2 !== 'AD') return true;
    if (p2 === 40 && p1 !== 40 && p1 !== 'AD') return true;
    return false;
  }

  private countSetsWon(
    sets: SetScore[],
    player1Id: string,
    player2Id: string,
  ): [number, number] {
    let p1Sets = 0;
    let p2Sets = 0;

    for (const set of sets) {
      if (set.winnerId === player1Id) p1Sets++;
      else if (set.winnerId === player2Id) p2Sets++;
    }

    return [p1Sets, p2Sets];
  }

  private async updatePlayerStats(
    player1Id: string,
    player2Id: string,
    winnerId: string,
  ): Promise<void> {
    // This is a simplified version - you'd want to update all stats properly
    const player1 = await this.prisma.player.findUnique({
      where: { id: player1Id },
    });
    const player2 = await this.prisma.player.findUnique({
      where: { id: player2Id },
    });

    if (player1 && player2) {
      const p1Stats = player1.stats as any;
      const p2Stats = player2.stats as any;

      p1Stats.matchesPlayed++;
      p2Stats.matchesPlayed++;

      if (winnerId === player1Id) {
        p1Stats.matchesWon++;
        p2Stats.matchesLost++;
      } else {
        p2Stats.matchesWon++;
        p1Stats.matchesLost++;
      }

      await this.prisma.player.update({
        where: { id: player1Id },
        data: { stats: p1Stats },
      });

      await this.prisma.player.update({
        where: { id: player2Id },
        data: { stats: p2Stats },
      });
    }
  }
}

