import { useState, useEffect } from 'react';
import { Match, MatchScore, WebSocketEvent } from '@repo/types';
import { wsClient } from '../lib/websocket';

interface ScoringProps {
  match: Match;
  onBack: () => void;
}

export function Scoring({ match, onBack }: ScoringProps) {
  const [score, setScore] = useState<MatchScore | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showUndo, setShowUndo] = useState(false);

  useEffect(() => {
    // Connect WebSocket
    wsClient.connect();
    
    // Check connection status
    const checkConnection = setInterval(() => {
      setIsConnected(wsClient.isConnected());
    }, 1000);

    // Join match
    wsClient.joinMatch(match.id);

    // Start match if not started
    if (match.status === 'SCHEDULED') {
      wsClient.startMatch(match.id);
    }

    // Listen for updates
    const handleUpdate = (data: any) => {
      setScore(data.score);
      setShowUndo(true);
      setTimeout(() => setShowUndo(false), 3000);
    };

    wsClient.on(WebSocketEvent.MATCH_UPDATED, handleUpdate);
    wsClient.on(WebSocketEvent.POINT_SCORED, handleUpdate);
    wsClient.on(WebSocketEvent.MATCH_STARTED, handleUpdate);
    wsClient.on(WebSocketEvent.MATCH_ENDED, handleUpdate);

    return () => {
      wsClient.off(WebSocketEvent.MATCH_UPDATED, handleUpdate);
      wsClient.off(WebSocketEvent.POINT_SCORED, handleUpdate);
      wsClient.off(WebSocketEvent.MATCH_STARTED, handleUpdate);
      wsClient.off(WebSocketEvent.MATCH_ENDED, handleUpdate);
      wsClient.leaveMatch(match.id);
      clearInterval(checkConnection);
    };
  }, [match.id, match.status]);

  const handleScorePoint = (player: 1 | 2) => {
    wsClient.scorePoint(match.id, player);
  };

  const handleUndo = () => {
    wsClient.undoPoint(match.id);
  };

  const sets = (score?.sets as any[]) || [];
  const games = (score?.games as [number, number]) || [0, 0];
  const points = (score?.points as any[]) || [0, 0];
  const tiebreakPoints = score?.tiebreakPoints as [number, number] | null;
  const isFinished = !!score?.winnerId;

  const formatPoint = (point: number | string) => {
    if (point === 'AD') return 'ADV';
    return point.toString();
  };

  const getSetScores = (playerId: string) => {
    return sets.map((set: any) => {
      const isPlayer1 = playerId === match.player1Id;
      const games = isPlayer1 ? set.player1Games : set.player2Games;
      const tiebreak = isPlayer1 ? set.player1TiebreakPoints : set.player2TiebreakPoints;
      return { games, tiebreak };
    });
  };

  const getWonSets = (playerId: string) => {
    return sets.filter((set: any) => set.winnerId === playerId).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 text-white p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-medium transition"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
          <span className="text-sm">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Tournament Name */}
      <div className="text-center mb-6">
        <div className="text-sm opacity-80">{match.tournament?.name}</div>
        <div className="text-xs opacity-60 mt-1">Best of {match.bestOf} Sets</div>
      </div>

      {/* Main Scoreboard */}
      <div className="bg-white bg-opacity-10 backdrop-blur rounded-2xl p-6 mb-6">
        {/* Player 1 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {score?.server === 1 && <span className="text-2xl">🎾</span>}
              <h2 className="text-2xl font-bold">{match.player1?.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Sets Won */}
            <div className="text-center">
              <div className="text-5xl font-bold">{getWonSets(match.player1Id)}</div>
              <div className="text-xs opacity-70 mt-1">SETS</div>
            </div>
            <div className="text-2xl opacity-50">|</div>
            {/* Games */}
            <div className="text-center">
              <div className="text-5xl font-bold">{games[0]}</div>
              <div className="text-xs opacity-70 mt-1">GAMES</div>
            </div>
            <div className="text-2xl opacity-50">|</div>
            {/* Points */}
            <div className="text-center flex-1">
              <div className="text-6xl font-bold">
                {score?.inTiebreak && tiebreakPoints
                  ? tiebreakPoints[0]
                  : formatPoint(points[0])}
              </div>
              <div className="text-xs opacity-70 mt-1">
                {score?.inTiebreak ? 'TIEBREAK' : 'POINTS'}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white border-opacity-20 my-4"></div>

        {/* Player 2 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {score?.server === 2 && <span className="text-2xl">🎾</span>}
              <h2 className="text-2xl font-bold">{match.player2?.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Sets Won */}
            <div className="text-center">
              <div className="text-5xl font-bold">{getWonSets(match.player2Id)}</div>
              <div className="text-xs opacity-70 mt-1">SETS</div>
            </div>
            <div className="text-2xl opacity-50">|</div>
            {/* Games */}
            <div className="text-center">
              <div className="text-5xl font-bold">{games[1]}</div>
              <div className="text-xs opacity-70 mt-1">GAMES</div>
            </div>
            <div className="text-2xl opacity-50">|</div>
            {/* Points */}
            <div className="text-center flex-1">
              <div className="text-6xl font-bold">
                {score?.inTiebreak && tiebreakPoints
                  ? tiebreakPoints[1]
                  : formatPoint(points[1])}
              </div>
              <div className="text-xs opacity-70 mt-1">
                {score?.inTiebreak ? 'TIEBREAK' : 'POINTS'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Set History */}
      {sets.length > 0 && (
        <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-4 mb-6">
          <div className="text-xs font-semibold mb-2 opacity-70">SET SCORES</div>
          <div className="flex gap-3">
            {getSetScores(match.player1Id).map((s: any, i: number) => (
              <div key={i} className="text-center">
                <div className="text-sm opacity-70">Set {i + 1}</div>
                <div className="font-bold text-lg mt-1">
                  {s.games}
                  {s.tiebreak !== undefined && (
                    <sup className="text-xs ml-0.5">({s.tiebreak})</sup>
                  )}
                </div>
                <div className="text-xs opacity-50">vs</div>
                <div className="font-bold text-lg">
                  {getSetScores(match.player2Id)[i].games}
                  {getSetScores(match.player2Id)[i].tiebreak !== undefined && (
                    <sup className="text-xs ml-0.5">
                      ({getSetScores(match.player2Id)[i].tiebreak})
                    </sup>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Result */}
      {isFinished && (
        <div className="bg-yellow-400 text-yellow-900 rounded-xl p-6 mb-6 text-center">
          <div className="text-2xl font-bold mb-2">🏆 Match Complete!</div>
          <div className="text-lg">
            Winner:{' '}
            {score.winnerId === match.player1Id
              ? match.player1?.name
              : match.player2?.name}
          </div>
        </div>
      )}

      {/* Scoring Buttons */}
      {!isFinished && (
        <div className="flex-1 flex flex-col gap-4 mt-auto">
          <button
            onClick={() => handleScorePoint(1)}
            disabled={!isConnected}
            className="flex-1 bg-white text-blue-700 rounded-2xl font-bold text-2xl py-8 hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {match.player1?.name} Scores
          </button>
          <button
            onClick={() => handleScorePoint(2)}
            disabled={!isConnected}
            className="flex-1 bg-white text-blue-700 rounded-2xl font-bold text-2xl py-8 hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {match.player2?.name} Scores
          </button>
        </div>
      )}

      {/* Undo Button */}
      {showUndo && !isFinished && (
        <button
          onClick={handleUndo}
          className="mt-4 w-full bg-red-500 hover:bg-red-600 rounded-xl font-bold py-4 transition shadow-lg"
        >
          ↺ Undo Last Point
        </button>
      )}
    </div>
  );
}

