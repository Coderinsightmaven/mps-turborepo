'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Player, CreatePlayerDto } from '@repo/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function PlayersPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState<CreatePlayerDto>({
    name: '',
    ranking: undefined,
    country: '',
  });

  // Fetch players
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await api.get<Player[]>('/players');
      return response.data;
    },
  });

  // Create player mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreatePlayerDto) => {
      return api.post('/players', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  // Update player mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatePlayerDto> }) => {
      return api.patch(`/players/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setIsEditOpen(false);
      setSelectedPlayer(null);
      resetForm();
    },
  });

  // Delete player mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/players/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setIsDeleteOpen(false);
      setSelectedPlayer(null);
    },
  });

  const resetForm = () => {
    setFormData({ name: '', ranking: undefined, country: '' });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (selectedPlayer) {
      updateMutation.mutate({ id: selectedPlayer.id, data: formData });
    }
  };

  const handleDelete = () => {
    if (selectedPlayer) {
      deleteMutation.mutate(selectedPlayer.id);
    }
  };

  const openEditDialog = (player: Player) => {
    setSelectedPlayer(player);
    setFormData({
      name: player.name,
      ranking: player.ranking || undefined,
      country: player.country || '',
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (player: Player) => {
    setSelectedPlayer(player);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Players</h1>
          <p className="text-zinc-500">Manage tournament players</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Player
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Players</CardTitle>
          <CardDescription>View and manage registered players</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading players...</div>
          ) : players.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No players yet. Add your first player to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Ranking</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Matches Played</TableHead>
                  <TableHead>Win Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => {
                  const stats = player.stats as any;
                  const winRate = stats.matchesPlayed > 0
                    ? ((stats.matchesWon / stats.matchesPlayed) * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>{player.ranking || '-'}</TableCell>
                      <TableCell>{player.country || '-'}</TableCell>
                      <TableCell>{stats.matchesPlayed}</TableCell>
                      <TableCell>{winRate}%</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(player)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(player)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>Create a new player profile</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Player name"
              />
            </div>
            <div>
              <Label htmlFor="ranking">Ranking</Label>
              <Input
                id="ranking"
                type="number"
                value={formData.ranking || ''}
                onChange={(e) => setFormData({ ...formData, ranking: parseInt(e.target.value) || undefined })}
                placeholder="e.g. 100"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g. USA"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>Update player information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-ranking">Ranking</Label>
              <Input
                id="edit-ranking"
                type="number"
                value={formData.ranking || ''}
                onChange={(e) => setFormData({ ...formData, ranking: parseInt(e.target.value) || undefined })}
              />
            </div>
            <div>
              <Label htmlFor="edit-country">Country</Label>
              <Input
                id="edit-country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name || updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Player</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedPlayer?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

