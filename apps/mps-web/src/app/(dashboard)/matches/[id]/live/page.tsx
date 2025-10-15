'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { wsClient } from '@/lib/websocket';
import { Match, MatchScore, WebSocketEvent } from '@repo/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LiveMatchPage() {
  const params = useParams();
  const matchId = params?.id as string;
  const [liveScore, setLiveScore] = useState<MatchScore | null>(null);

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await api.get<Match>(`/matches/${matchId}`);
      return response.data;
    },
  });

  const { data: score } = useQuery({
    queryKey: ['score', matchId],
    queryFn: async () => {
      const response = await api.get<MatchScore>(`/scoring/${matchId}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (score) {
      setLiveScore(score);
    }
  }, [score]);

  useEffect(() => {
    // Connect WebSocket
    wsClient.connect();
    wsClient.joinMatch(matchId);

    // Listen for score updates
    const handleMatchUpdated = (data: any) => {
      setLiveScore(data.score);
    };

    const handlePointScored = (data: any) => {
      setLiveScore(data.score);
    };

    const handleMatchEnded = (data: any) => {
      setLiveScore(data.score);
    };

    wsClient.on(WebSocketEvent.MATCH_UPDATED, handleMatchUpdated);
    wsClient.on(WebSocketEvent.POINT_SCORED, handlePointScored);
    wsClient.on(WebSocketEvent.MATCH_ENDED, handleMatchEnded);

    return () => {
      wsClient.off(WebSocketEvent.MATCH_UPDATED, handleMatchUpdated);
      wsClient.off(WebSocketEvent.POINT_SCORED, handlePointScored);
      wsClient.off(WebSocketEvent.MATCH_ENDED, handleMatchEnded);
      wsClient.leaveMatch(matchId);
    };
  }, [matchId]);

  if (isLoading) {
    return <div className="text-center py-8">Loading match...</div>;
  }

  if (!match) {
    return <div className="text-center py-8">Match not found</div>;
  }

  const sets = (liveScore?.sets as any[]) || [];
  const games = (liveScore?.games as [number, number]) || [0, 0];
  const points = (liveScore?.points as any[]) || [0, 0];
  const tiebreakPoints = liveScore?.tiebreakPoints as [number, number] | null;

  const formatPoint = (point: number | string) => {
    if (point === 'AD') return 'A';
    return point.toString();
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/matches">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Matches
          </Button>
        </Link>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">{match.tournament?.name}</h1>
        <Badge className="bg-green-500">LIVE</Badge>
      </div>

      {/* Live Scoreboard */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Live Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Players and Current Score */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center text-lg">
              {/* Player 1 */}
              <div className={`font-semibold ${liveScore?.server === 1 ? 'flex items-center' : ''}`}>
                {liveScore?.server === 1 && <span className="mr-2">🎾</span>}
                {match.player1?.name}
              </div>
              <div className="text-center font-mono text-2xl w-16">
                {sets.reduce((acc, set) => acc + (set.winnerId === match.player1Id ? 1 : 0), 0)}
              </div>
              <div className="text-center font-mono text-2xl w-16">{games[0]}</div>
              <div className="text-center font-mono text-3xl w-20 font-bold">
                {liveScore?.inTiebreak && tiebreakPoints ? tiebreakPoints[0] : formatPoint(points[0])}
              </div>

              {/* Player 2 */}
              <div className={`font-semibold ${liveScore?.server === 2 ? 'flex items-center' : ''}`}>
                {liveScore?.server === 2 && <span className="mr-2">🎾</span>}
                {match.player2?.name}
              </div>
              <div className="text-center font-mono text-2xl w-16">
                {sets.reduce((acc, set) => acc + (set.winnerId === match.player2Id ? 1 : 0), 0)}
              </div>
              <div className="text-center font-mono text-2xl w-16">{games[1]}</div>
              <div className="text-center font-mono text-3xl w-20 font-bold">
                {liveScore?.inTiebreak && tiebreakPoints ? tiebreakPoints[1] : formatPoint(points[1])}
              </div>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 text-xs text-zinc-500 uppercase border-t pt-2">
              <div>Player</div>
              <div className="text-center w-16">Sets</div>
              <div className="text-center w-16">Games</div>
              <div className="text-center w-20">{liveScore?.inTiebreak ? 'Tiebreak' : 'Points'}</div>
            </div>

            {/* Set Scores */}
            {sets.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-semibold mb-2">Set Scores</h3>
                <div className="space-y-2">
                  {sets.map((set: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 text-sm">
                      <span className="w-16">Set {set.setNumber}</span>
                      <div className="flex gap-2">
                        <span className={`w-12 text-center ${set.winnerId === match.player1Id ? 'font-bold' : ''}`}>
                          {set.player1Games}
                          {set.player1TiebreakPoints !== undefined && (
                            <sup className="text-xs">({set.player1TiebreakPoints})</sup>
                          )}
                        </span>
                        <span>-</span>
                        <span className={`w-12 text-center ${set.winnerId === match.player2Id ? 'font-bold' : ''}`}>
                          {set.player2Games}
                          {set.player2TiebreakPoints !== undefined && (
                            <sup className="text-xs">({set.player2TiebreakPoints})</sup>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Match Info */}
            <div className="mt-6 border-t pt-4 text-sm text-zinc-600">
              <div>Best of {match.bestOf} sets</div>
              {liveScore?.currentSet && <div>Current Set: {liveScore.currentSet}</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Point History */}
      {liveScore?.history && (liveScore.history as any[]).length > 0 && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Recent Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(liveScore.history as any[]).slice(-10).reverse().map((point: any, index: number) => (
                <div key={index} className="text-sm text-zinc-600">
                  Point won by {point.pointWinner === 1 ? match.player1?.name : match.player2?.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

