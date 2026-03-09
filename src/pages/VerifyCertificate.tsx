import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle, XCircle, Award } from 'lucide-react';
import { format } from 'date-fns';

interface Certificate {
  id: string;
  student_name: string;
  quiz_title: string;
  score: number;
  total_marks: number;
  percentage: number;
  issued_at: string;
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

    supabase
      .from('certificates')
      .select('id, student_name, quiz_title, score, total_marks, percentage, issued_at')
      .eq('id', certificateId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setCertificate(data);
        }
        setLoading(false);
      });
  }, [certificateId]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {loading ? (
            <p className="text-center text-muted-foreground">Verifying certificate...</p>
          ) : notFound ? (
            <Card className="border-destructive">
              <CardHeader className="text-center">
                <XCircle className="mx-auto h-16 w-16 text-destructive" />
                <CardTitle className="mt-4 text-2xl text-destructive">Invalid Certificate</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  This certificate ID is not valid or does not exist in our records.
                </p>
              </CardContent>
            </Card>
          ) : certificate ? (
            <Card className="border-primary">
              <CardHeader className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-primary" />
                <CardTitle className="mt-4 text-2xl text-primary">Certificate Verified</CardTitle>
                <Badge variant="secondary" className="mx-auto mt-2">
                  <Award className="mr-1 h-3 w-3" /> Authentic
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Student Name</span>
                    <span className="font-semibold">{certificate.student_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Quiz</span>
                    <span className="font-semibold">{certificate.quiz_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Score</span>
                    <span className="font-semibold">{certificate.score} / {certificate.total_marks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Percentage</span>
                    <span className="font-semibold">{certificate.percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Issued On</span>
                    <span className="font-semibold">
                      {format(new Date(certificate.issued_at), 'MMMM do, yyyy')}
                    </span>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Certificate ID: {certificate.id}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
