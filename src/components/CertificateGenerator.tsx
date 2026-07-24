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

    const { data, error } = await supabase.functions.invoke('ensure-certificate', {
      body: { submissionId, quizId, studentName, quizTitle },
    });
    if (error || !data?.certificateId) throw error || new Error('Failed to create certificate');
    setCertificateId(data.certificateId);
    return data.certificateId;
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
          padding: '28px',
          boxSizing: 'border-box',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          fontFamily: "'Sora', 'Manrope', sans-serif",
          background:
            'radial-gradient(1200px 700px at 15% 10%, rgba(139,92,246,0.22), transparent 60%), radial-gradient(1000px 600px at 85% 90%, rgba(34,211,238,0.18), transparent 60%), linear-gradient(135deg, #05060a 0%, #0b0f1c 50%, #05060a 100%)',
          color: '#e6edf7',
          zIndex: -1,
        }}
      >
        <div
          style={{
            border: '1px solid rgba(139,92,246,0.35)',
            boxShadow: 'inset 0 0 0 1px rgba(34,211,238,0.15), 0 0 60px rgba(139,92,246,0.25)',
            borderRadius: '18px',
            padding: '36px 44px',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Watermark logo */}
          <img
            src={logoDataUrl || universityLogo}
            alt=""
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '520px',
              height: '520px',
              objectFit: 'contain',
              opacity: 0.06,
              filter: 'grayscale(1) brightness(2)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
            <img src={logoDataUrl || universityLogo} alt="University Logo" style={{ height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.5))' }} />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontFamily: "'Playfair Display', 'Sora', serif", fontSize: '34px', margin: 0, fontWeight: 700, letterSpacing: '1px', background: 'linear-gradient(90deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sharnbasva University</h1>
              <h2 style={{ fontSize: '18px', color: '#c7d2fe', margin: '4px 0 0 0', fontWeight: 500 }}>Faculty of Engineering & Technology</h2>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0 0', letterSpacing: '2px', textTransform: 'uppercase' }}>Department of Computer Science & Design</p>
            </div>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '46px', color: '#f8fafc', margin: '8px 0', letterSpacing: '10px', paddingBottom: '10px', position: 'relative', zIndex: 1, fontStyle: 'italic', fontWeight: 500 }}>
            Certificate of Completion
          </h1>
          <div style={{ width: '160px', height: '1px', background: 'linear-gradient(90deg, transparent, #22d3ee, transparent)', margin: '-4px 0 4px', position: 'relative', zIndex: 1 }} />

          <p style={{ fontSize: '16px', color: '#94a3b8', margin: '8px 0', letterSpacing: '4px', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
            This is to certify that
          </p>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '44px', margin: '4px 0', fontStyle: 'italic', fontWeight: 700, background: 'linear-gradient(90deg,#e9d5ff,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', position: 'relative', zIndex: 1 }}>
            {studentName}
          </h2>

          <p style={{ fontSize: '17px', color: '#cbd5e1', margin: '6px 0', textAlign: 'center', maxWidth: '800px', position: 'relative', zIndex: 1 }}>
            has successfully completed the assessment for
            <br />
            <strong style={{ color: '#f8fafc', fontSize: '26px', display: 'inline-block', marginTop: '8px', fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>{quizTitle}</strong>
          </p>

          <div style={{ display: 'flex', gap: '40px', margin: '10px 0 0', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', padding: '14px 40px', borderRadius: '12px', position: 'relative', zIndex: 1, backdropFilter: 'blur(6px)' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '3px' }}>Score</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '26px', fontWeight: 700, color: '#e9d5ff' }}>{score} / {totalMarks}</p>
            </div>
            <div style={{ width: '1px', background: 'linear-gradient(180deg, transparent, rgba(34,211,238,0.5), transparent)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '3px' }}>Percentage</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '26px', fontWeight: 700, color: '#67e8f9' }}>{percentage}%</p>
            </div>
          </div>

          {/* Date + QR row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: '16px', padding: '14px 20px 0', borderTop: '1px solid rgba(148,163,184,0.2)', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid rgba(148,163,184,0.4)', width: '220px', marginBottom: '8px', paddingBottom: '6px', fontSize: '16px', color: '#e2e8f0', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
                {format(date, 'MMMM do, yyyy')}
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', letterSpacing: '3px', textTransform: 'uppercase' }}>Date of Completion</p>
            </div>

            {/* QR Code for verification */}
            <div style={{ textAlign: 'center' }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Verify QR" style={{ width: '96px', height: '96px', padding: '6px', background: '#fff', borderRadius: '8px', boxShadow: '0 0 20px rgba(34,211,238,0.35)' }} />
              ) : (
                <div style={{ width: '96px', height: '96px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
              )}
              <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: '#94a3b8', letterSpacing: '3px', textTransform: 'uppercase' }}>Scan to verify</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
