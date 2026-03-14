// Study Materials page
// Faculty can upload files, everyone can view/download

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, FileText, Download, Trash2, Plus, ArrowLeft } from 'lucide-react';

interface Material {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export default function Materials() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const isFacultyOrAdmin = role === 'faculty' || role === 'admin';

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  // Fetch materials
  async function fetchMaterials() {
    setLoadingData(true);
    const { data } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });
    setMaterials(data || []);
    setLoadingData(false);
  }

  useEffect(() => {
    if (user) fetchMaterials();
  }, [user]);

  // Upload material
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !file) return;

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      // Save to materials table
      const { error: dbError } = await supabase.from('materials').insert({
        title,
        description: description || null,
        file_url: urlData.publicUrl,
        file_type: fileExt || null,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      toast({ title: 'Material uploaded successfully!' });
      setTitle('');
      setDescription('');
      setFile(null);
      setDialogOpen(false);
      fetchMaterials();
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }

  // Delete material
  async function handleDelete(material: Material) {
    if (!confirm('Delete this material?')) return;

    // Extract file path from URL
    if (material.file_url) {
      const parts = material.file_url.split('/materials/');
      if (parts[1]) {
        await supabase.storage.from('materials').remove([decodeURIComponent(parts[1])]);
      }
    }

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', material.id);

    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Material deleted.' });
      fetchMaterials();
    }
  }

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-heading text-2xl font-bold">Study Materials</h1>
              <p className="text-muted-foreground">
                {isFacultyOrAdmin
                  ? 'Upload and manage learning resources.'
                  : 'Download study materials shared by faculty.'}
              </p>
              </div>
            </div>

            {isFacultyOrAdmin && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Upload Material
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Study Material</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mat-title">Title</Label>
                      <Input
                        id="mat-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Data Structures Notes - Unit 1"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mat-desc">Description (optional)</Label>
                      <Textarea
                        id="mat-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description of the material"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mat-file">File</Label>
                      <Input
                        id="mat-file"
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        required
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png,.zip"
                      />
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, PPT, TXT, images, ZIP (max 20MB)
                      </p>
                    </div>
                    <Button type="submit" disabled={uploading} className="w-full gap-2">
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {loadingData ? (
            <p className="text-center text-muted-foreground">Loading materials...</p>
          ) : materials.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">No study materials uploaded yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {materials.map((m) => (
                <Card key={m.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{m.title}</CardTitle>
                      {m.file_type && (
                        <Badge variant="secondary" className="shrink-0 uppercase text-xs">
                          {m.file_type}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    {m.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {m.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {m.file_url && (
                        <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <Download className="h-3.5 w-3.5" /> Download
                          </Button>
                        </a>
                      )}
                      {isFacultyOrAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(m)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
