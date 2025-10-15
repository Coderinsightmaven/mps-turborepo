import { useState, useEffect } from 'react';
import { Match } from '@repo/types';
import { apiRequest } from '../lib/api';

interface MatchListProps {
  onSelectMatch: (match: Match) => void;
}

export function MatchList({ onSelectMatch }: MatchListProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in_progress'>('all');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      // In a real app, you'd use a stored token
      const data = await apiRequest<Match[]>('/matches');
      setMatches(data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter((match) => {
    if (filter === 'scheduled') return match.status === 'SCHEDULED';
    if (filter === 'in_progress') return match.status === 'IN_PROGRESS';
    return true;
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Select Match to Score</h1>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 bg-white p-2 rounded-lg shadow">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('scheduled')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
              filter === 'scheduled'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Scheduled
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
              filter === 'in_progress'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            In Progress
          </button>
        </div>

        {/* Match Cards */}
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No matches found
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <button
                key={match.id}
                onClick={() => onSelectMatch(match)}
                className="w-full bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-left"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">
                      {match.tournament?.name}
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {match.player1?.name}
                    </div>
                    <div className="text-sm text-gray-400 my-2">vs</div>
                    <div className="text-xl font-bold text-gray-900">
                      {match.player2?.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        match.status === 'SCHEDULED'
                          ? 'bg-blue-100 text-blue-800'
                          : match.status === 'IN_PROGRESS'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {match.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>Best of {match.bestOf} sets</div>
                  {match.scheduledAt && (
                    <div>{formatDate(match.scheduledAt)}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={loadMatches}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
          >
            Refresh Matches
          </button>
        </div>
      </div>
    </div>
  );
}

