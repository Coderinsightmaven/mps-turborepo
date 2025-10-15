'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Match, Player, Tournament, CreateMatchDto, MatchStatus } from '@repo/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function MatchesPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const tournamentId = searchParams?.get('tournamentId');
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateMatchDto>({
    tournamentId: tournamentId || '',
    player1Id: '',
    player2Id: '',
    scheduledAt: '',
    bestOf: 3,
  });

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches', tournamentId],
    queryFn: async () => {
      const url = tournamentId ? `/matches?tournamentId=${tournamentId}` : '/matches';
      const response = await api.get<Match[]>(url);
      return response.data;
    },
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await api.get<Player[]>('/players');
      return response.data;
    },
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const response = await api.get<Tournament[]>('/tournaments');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateMatchDto) => {
      return api.post('/matches', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  useEffect(() => {
    if (tournamentId && formData.tournamentId !== tournamentId) {
      setFormData(prev => ({ ...prev, tournamentId }));
    }
  }, [tournamentId]);

  const resetForm = () => {
    setFormData({
      tournamentId: tournamentId || '',
      player1Id: '',
      player2Id: '',
      scheduledAt: '',
      bestOf: 3,
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const getStatusColor = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.SCHEDULED: return 'bg-blue-500';
      case MatchStatus.IN_PROGRESS: return 'bg-green-500';
      case MatchStatus.COMPLETED: return 'bg-gray-500';
      case MatchStatus.CANCELLED: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Matches</h1>
          <p className="text-zinc-500">Schedule and manage matches</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Match
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading matches...</div>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-zinc-500">
            No matches scheduled yet. Create a match to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <Card key={match.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {match.player1?.name} vs {match.player2?.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {match.tournament?.name}
                      {match.scheduledAt && ` • ${format(new Date(match.scheduledAt), 'PPp')}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(match.status)}>
                      {match.status}
                    </Badge>
                    {match.status === MatchStatus.IN_PROGRESS && (
                      <Link href={`/dashboard/matches/${match.id}/live`}>
                        <Button size="sm">View Live</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-zinc-600">
                  Best of {match.bestOf} sets
                  {match.winner && ` • Winner: ${match.winner.name}`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Match</DialogTitle>
            <DialogDescription>Create a new match</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tournament">Tournament *</Label>
              <select
                id="tournament"
                className="w-full border rounded-md p-2"
                value={formData.tournamentId}
                onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
              >
                <option value="">Select tournament</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="player1">Player 1 *</Label>
              <select
                id="player1"
                className="w-full border rounded-md p-2"
                value={formData.player1Id}
                onChange={(e) => setFormData({ ...formData, player1Id: e.target.value })}
              >
                <option value="">Select player</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="player2">Player 2 *</Label>
              <select
                id="player2"
                className="w-full border rounded-md p-2"
                value={formData.player2Id}
                onChange={(e) => setFormData({ ...formData, player2Id: e.target.value })}
              >
                <option value="">Select player</option>
                {players.filter(p => p.id !== formData.player1Id).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="scheduledAt">Scheduled Time</Label>
              <input
                id="scheduledAt"
                type="datetime-local"
                className="w-full border rounded-md p-2"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bestOf">Best of</Label>
              <select
                id="bestOf"
                className="w-full border rounded-md p-2"
                value={formData.bestOf}
                onChange={(e) => setFormData({ ...formData, bestOf: parseInt(e.target.value) })}
              >
                <option value={3}>3 sets</option>
                <option value={5}>5 sets</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!formData.tournamentId || !formData.player1Id || !formData.player2Id || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Match'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

