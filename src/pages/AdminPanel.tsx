// Admin Panel - manage user roles
// Only accessible by admin users

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Shield, Trash2, Download, Search, KeyRound } from 'lucide-react';

interface UserWithRole {
  user_id: string;
  full_name: string;
  email?: string;
  usn?: string;
  role: string;
  role_id: string;
}

export default function AdminPanel() {
  const { user, role, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!user || role !== 'admin')) {
      navigate('/dashboard');
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (user && role === 'admin') {
      fetchUsers();
    }
  }, [user, role]);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_users_with_emails');

    if (error) {
      toast({ title: 'Error', description: error.message || 'Could not load users.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const usersData: UserWithRole[] = (data || []).map((u: any) => ({
      user_id: u.user_id,
      email: u.email || 'No email',
      full_name: u.full_name || 'Unknown',
      usn: u.usn || '',
      role: u.role,
      role_id: u.role_id,
    }));

    setUsers(usersData);
    setLoading(false);
  }

  async function handleRoleChange(roleId: string, userId: string, newRole: string) {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole as 'admin' | 'faculty' | 'student' })
      .eq('id', roleId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.role_id === roleId ? { ...u, role: newRole } : u))
    );
    toast({ title: 'Role updated', description: `User role changed to ${newRole}.` });
  }

  async function handleRemoveUser(userId: string, fullName: string) {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: userId },
    });

    if (error) {
      toast({ title: 'Error', description: error.message || 'Could not remove user.', variant: 'destructive' });
      return;
    }

    if (data && !data.success) {
      toast({ title: 'Error', description: data.error || 'Could not remove user.', variant: 'destructive' });
      return;
    }

    setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    toast({ title: 'User removed', description: `${fullName} has been permanently removed and must re-register to access the system.` });
  }

  async function handleResetPassword() {
    if (!resetTarget || !newPassword) return;
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    setResetting(true);
    const { data, error } = await supabase.functions.invoke('admin-reset-password', {
      body: { user_id: resetTarget.user_id, new_password: newPassword },
    });

    if (error) {
      toast({ title: 'Error', description: error.message || 'Failed to reset password.', variant: 'destructive' });
      setResetting(false);
      return;
    }

    if (data && !data.success) {
      toast({ title: 'Error', description: data.error || 'Failed to reset password.', variant: 'destructive' });
      setResetting(false);
      return;
    }

    toast({ title: 'Password reset', description: `Password for ${resetTarget.full_name} has been updated.` });
    setResetDialogOpen(false);
    setNewPassword('');
    setResetTarget(null);
    setResetting(false);
  }

  function handleExportUsers() {
    if (filteredUsers.length === 0) {
      toast({ title: 'No users', description: 'No users to export.', variant: 'destructive' });
      return;
    }

    const headers = ['Name', 'Email', 'USN', 'Role'];
    const rows = filteredUsers.map(u => [
      u.full_name,
      u.email || '',
      u.usn || '',
      u.role,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Exported', description: `${filteredUsers.length} users exported to CSV.` });
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (role !== 'admin') return null;

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      u.full_name.toLowerCase().includes(query) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.usn && u.usn.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="font-heading text-2xl font-bold">Admin Panel – Manage Users</h1>
            </div>
            <Button onClick={handleExportUsers} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Users
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle>All Users ({filteredUsers.length})</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or USN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <p className="text-muted-foreground">
                  {searchQuery ? 'No users match your search.' : 'No users found.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Change Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.role_id}>
                          <TableCell className="font-medium">{u.full_name}</TableCell>
                          <TableCell className="text-muted-foreground">{u.usn || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <span className="capitalize">{u.role}</span>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={u.role}
                              onValueChange={(val) => handleRoleChange(u.role_id, u.user_id, val)}
                              disabled={u.user_id === user?.id}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="faculty">Faculty</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {u.user_id !== user?.id && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setResetTarget(u);
                                      setNewPassword('');
                                      setResetDialogOpen(true);
                                    }}
                                  >
                                    <KeyRound className="mr-1 h-4 w-4" />
                                    Reset
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm">
                                        <Trash2 className="mr-1 h-4 w-4" />
                                        Remove
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove {u.full_name}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete this user. They will need to register again to access the system. This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveUser(u.user_id, u.full_name)}>
                                          Remove
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetTarget?.full_name}</strong> ({resetTarget?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={resetting || newPassword.length < 6}>
              {resetting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
