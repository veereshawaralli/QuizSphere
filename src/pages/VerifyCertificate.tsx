import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle2, XCircle, Award, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface Certificate {
  id: string;
  student_name: string;
  quiz_title: string;
  score: number;
  total_marks: number;
  percentage: number;
  issued_at: string;
  rank: number | null;
  total_participants: number | null;
}

export default function VerifyCertificate() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!certificateId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    // Certificates are no longer readable by anonymous users at the row level;
    // the verify-cert edge function returns only the fields needed here.
    supabase.functions
      .invoke('verify-cert', { body: { certificateId } })
      .then(({ data, error }) => {
        const cert = (data as { certificate?: Certificate } | null)?.certificate;
        if (error || !cert) setNotFound(true);
        else setCertificate(cert);
        setLoading(false);
      });
  }, [certificateId]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="relative flex-1 flex items-center justify-center px-4 py-12 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="blob"
            style={{ width: 460, height: 460, top: '-10%', right: '-10%',
              background: 'radial-gradient(circle, hsl(var(--accent) / 0.45), transparent 60%)' }} />
          <div className="blob"
            style={{ width: 380, height: 380, bottom: '-15%', left: '-5%',
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.45), transparent 60%)',
              animationDelay: '-7s' }} />
        </div>

        <div className="relative w-full max-w-md bounce-in">
          {loading ? (
            <p className="text-center eyebrow text-gradient-candy">Verifying certificate…</p>
          ) : notFound ? (
            <div className="glass-strong rounded-3xl p-10 text-center">
              <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/15 mb-4">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-destructive">Invalid Certificate</h2>
              <p className="mt-3 text-muted-foreground">
                This certificate ID is not valid or does not exist in our records.
              </p>
            </div>
          ) : certificate ? (
            <div className="relative glass-strong rounded-3xl p-10 overflow-hidden">
              <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-candy opacity-30 blur-3xl" />
              <div className="text-center relative">
                <div className="relative mx-auto inline-flex float-y mb-4">
                  <span className="absolute inset-0 rounded-full bg-gradient-candy opacity-60 blur-xl" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-candy shadow-pop">
                    <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.2} />
                  </div>
                </div>
                <span className="pill glass eyebrow text-success inline-flex">
                  <Sparkles className="h-3 w-3" /> Verified
                </span>
                <h2 className="mt-4 font-heading text-3xl font-bold">
                  <span className="text-foreground">Certificate </span>
                  <span className="text-gradient-candy">Verified</span>
                </h2>
                <Badge variant="default" className="mx-auto mt-3 inline-flex">
                  <Award className="mr-1 h-3 w-3" /> Authentic
                </Badge>
              </div>
              <div className="mt-6 rounded-2xl glass p-5 space-y-3 relative">
                <Row label="Student Name" value={certificate.student_name} />
                <Row label="Quiz" value={certificate.quiz_title} />
                <Row label="Score" value={`${certificate.score} / ${certificate.total_marks}`} />
                <Row label="Percentage" value={`${certificate.percentage}%`} />
                <Row
                  label="Rank"
                  value={
                    certificate.rank && certificate.total_participants
                      ? `#${certificate.rank} of ${certificate.total_participants}`
                      : '—'
                  }
                />
                <Row label="Issued On" value={format(new Date(certificate.issued_at), 'MMMM do, yyyy')} />
              </div>
              <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground">
                Certificate ID: {certificate.id}
              </p>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="eyebrow text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground text-right">{value}</span>
    </div>
  );
}
