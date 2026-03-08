// Admin Panel - manage user roles
// Only accessible by admin users

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Shield, Trash2 } from 'lucide-react';

interface UserWithRole {
  user_id: string;
  full_name: string;
  email?: string;
  role: string;
  role_id: string;
}

export default function AdminPanel() {
  const { user, role, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
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
    // Fetch profiles and roles separately, then merge
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name'),
      supabase.from('user_roles').select('id, user_id, role'),
    ]);

    if (profilesRes.error || rolesRes.error) {
      toast({ title: 'Error', description: 'Could not load users.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const merged: UserWithRole[] = (rolesRes.data || []).map((r) => {
      const profile = (profilesRes.data || []).find((p) => p.user_id === r.user_id);
      return {
        user_id: r.user_id,
        full_name: profile?.full_name || 'Unknown',
        role: r.role,
        role_id: r.id,
      };
    });

    setUsers(merged);
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
    // Delete role and profile entries for this user
    const [roleRes, profileRes] = await Promise.all([
      supabase.from('user_roles').delete().eq('user_id', userId),
      supabase.from('profiles').delete().eq('user_id', userId),
    ]);

    if (roleRes.error || profileRes.error) {
      toast({ title: 'Error', description: roleRes.error?.message || profileRes.error?.message || 'Could not remove user.', variant: 'destructive' });
      return;
    }

    setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    toast({ title: 'User removed', description: `${fullName} has been removed.` });
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (role !== 'admin') return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="font-heading text-2xl font-bold">Admin Panel – Manage Roles</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-muted-foreground">No users found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.role_id}>
                        <TableCell className="font-medium">{u.full_name}</TableCell>
                        <TableCell>
                          <span className="capitalize">{u.role}</span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(val) => handleRoleChange(u.role_id, u.user_id, val)}
                            disabled={u.user_id === user?.id}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="faculty">Faculty</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
