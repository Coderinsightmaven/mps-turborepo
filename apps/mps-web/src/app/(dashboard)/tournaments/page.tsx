'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { api } from '@/lib/api';
import { Tournament, CreateTournamentDto, TournamentFormat, TournamentStatus } from '@repo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function TournamentsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateTournamentDto>({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    format: TournamentFormat.SINGLE_ELIMINATION,
  });

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const response = await api.get<Tournament[]>('/tournaments');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateTournamentDto) => {
      return api.post('/tournaments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      startDate: '',
      endDate: '',
      format: TournamentFormat.SINGLE_ELIMINATION,
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.UPCOMING: return 'bg-blue-500';
      case TournamentStatus.IN_PROGRESS: return 'bg-green-500';
      case TournamentStatus.COMPLETED: return 'bg-gray-500';
      case TournamentStatus.CANCELLED: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <p className="text-zinc-500">Manage and organize tournaments</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Tournament
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading tournaments...</div>
      ) : tournaments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-zinc-500">
            No tournaments yet. Create your first tournament to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <Link key={tournament.id} href={`/dashboard/matches?tournamentId=${tournament.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    <Badge className={getStatusColor(tournament.status)}>
                      {tournament.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{tournament.name}</CardTitle>
                  <CardDescription className="space-y-2 mt-2">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {tournament.location}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(tournament.startDate), 'MMM d')} - {format(new Date(tournament.endDate), 'MMM d, yyyy')}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-zinc-600">
                    Format: {tournament.format.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-zinc-600 mt-1">
                    {tournament.matches?.length || 0} matches
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Tournament</DialogTitle>
            <DialogDescription>Set up a new tournament</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tournament Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Summer Championship"
              />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="New York, USA"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="format">Format *</Label>
              <select
                id="format"
                className="w-full border rounded-md p-2"
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as TournamentFormat })}
              >
                <option value={TournamentFormat.SINGLE_ELIMINATION}>Single Elimination</option>
                <option value={TournamentFormat.DOUBLE_ELIMINATION}>Double Elimination</option>
                <option value={TournamentFormat.ROUND_ROBIN}>Round Robin</option>
                <option value={TournamentFormat.SWISS}>Swiss System</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Tournament'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

