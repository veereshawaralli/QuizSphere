import React, { useRef, useState, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Button } from './ui/button';
import { Download, Award } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import universityLogo from '../assets/university-logo.png';

interface CertificateProps {
  studentName: string;
  quizTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  date: Date;
  submissionId: string;
  quizId: string;
  studentId: string;
}

export function CertificateGenerator({
  studentName,
  quizTitle,
  score,
  totalMarks,
  percentage,
  date,
  submissionId,
  quizId,
  studentId,
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [certificateId, setCertificateId] = useState<string | null>(null);

  const eligible = percentage >= 70;

  const ensureLogoDataUrl = useCallback(async () => {
    if (logoDataUrl) return logoDataUrl;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const dataUrl = await new Promise<string>((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas error')); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Logo failed to load'));
      img.src = universityLogo;
    });

    setLogoDataUrl(dataUrl);
    return dataUrl;
  }, [logoDataUrl]);

  useEffect(() => {
    ensureLogoDataUrl().catch(console.error);
  }, [ensureLogoDataUrl]);

  // Check if certificate already exists for this submission
  useEffect(() => {
    if (!submissionId) return;
    supabase
      .from('certificates')
      .select('id')
      .eq('submission_id', submissionId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCertificateId(data.id);
      });
  }, [submissionId]);

  if (!eligible) {
    return null;
  }

  const getOrCreateCertificate = async (): Promise<string> => {
    if (certificateId) return certificateId;

    // Check again in case of race condition
    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('submission_id', submissionId)
      .maybeSingle();

    if (existing) {
      setCertificateId(existing.id);
      return existing.id;
    }

    const { data: newCert, error } = await supabase
      .from('certificates')
      .insert({
        student_id: studentId,
        submission_id: submissionId,
        quiz_id: quizId,
        student_name: studentName,
        quiz_title: quizTitle,
        score,
        total_marks: totalMarks,
        percentage,
      })
      .select('id')
      .single();

    if (error || !newCert) throw error || new Error('Failed to create certificate');
    setCertificateId(newCert.id);
    return newCert.id;
  };

  const handleDownload = async () => {
    if (!certificateRef.current || percentage < 70) return;
    setIsGenerating(true);

    try {
      await ensureLogoDataUrl();

      // Get or create certificate record
      const certId = await getOrCreateCertificate();

      // Generate QR code pointing to verify page
      const verifyUrl = `${window.location.origin}/verify/${certId}`;
      const qrUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 });
      setQrDataUrl(qrUrl);

      // Wait a tick for the QR to render in DOM
      await new Promise((r) => setTimeout(r, 100));

      certificateRef.current.style.display = 'flex';

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      certificateRef.current.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${studentName.replace(/\s+/g, '_')}_${quizTitle.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (error) {
      console.error('Error generating certificate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button onClick={handleDownload} disabled={isGenerating} className="gap-2 w-full sm:w-auto">
        {isGenerating ? (
          <Award className="h-4 w-4 animate-pulse" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isGenerating ? 'Generating...' : 'Download Certificate'}
      </Button>

      {/* Hidden Certificate DOM Element */}
      <div
        ref={certificateRef}
        style={{
          display: 'none',
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1056px',
          height: '816px',
          backgroundColor: 'white',
          padding: '40px',
          boxSizing: 'border-box',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          border: '20px solid #1e3a8a',
          fontFamily: 'sans-serif',
          backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          zIndex: -1,
        }}
      >
        <div
          style={{
            border: '4px solid #1e3a8a',
            padding: '32px',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'white',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <img src={logoDataUrl || universityLogo} alt="University Logo" style={{ height: '80px', objectFit: 'contain' }} />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '32px', color: '#1e3a8a', margin: '0', fontWeight: 'bold' }}>Sharnbasva University</h1>
              <h2 style={{ fontSize: '20px', color: '#334155', margin: '5px 0 0 0' }}>Faculty of Engineering & Technology</h2>
              <p style={{ fontSize: '16px', color: '#64748b', margin: '5px 0 0 0' }}>Department of Computer Science & Design</p>
            </div>
          </div>

          <h1 style={{ fontSize: '40px', color: '#0f172a', margin: '8px 0', textTransform: 'uppercase', letterSpacing: '4px', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px' }}>
            Certificate of Completion
          </h1>

          <p style={{ fontSize: '18px', color: '#475569', margin: '8px 0' }}>
            This is to certify that
          </p>

          <h2 style={{ fontSize: '32px', color: '#1e3a8a', margin: '4px 0', fontStyle: 'italic', fontWeight: 'bold' }}>
            {studentName}
          </h2>

          <p style={{ fontSize: '18px', color: '#475569', margin: '8px 0', textAlign: 'center', maxWidth: '800px' }}>
            has successfully completed the assessment for
            <br />
            <strong style={{ color: '#0f172a', fontSize: '24px', display: 'inline-block', marginTop: '10px' }}>{quizTitle}</strong>
          </p>

          <div style={{ display: 'flex', gap: '40px', margin: '10px 0 0', backgroundColor: '#f8fafc', padding: '14px 36px', borderRadius: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Score</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{score} / {totalMarks}</p>
            </div>
            <div style={{ width: '2px', backgroundColor: '#cbd5e1' }}></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Percentage</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{percentage}%</p>
            </div>
          </div>

          {/* Date + QR row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: '16px', padding: '14px 20px 0', borderTop: '1px solid #cbd5e1' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #0f172a', width: '200px', marginBottom: '10px', paddingBottom: '5px', fontSize: '16px', color: '#334155' }}>
                {format(date, 'MMMM do, yyyy')}
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Date of Completion</p>
            </div>

            {/* QR Code for verification */}
            <div style={{ textAlign: 'center' }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Verify QR" style={{ width: '90px', height: '90px' }} />
              ) : (
                <div style={{ width: '90px', height: '90px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
              )}
              <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#64748b' }}>Scan to verify</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
