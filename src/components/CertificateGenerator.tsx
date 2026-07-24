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
          padding: '24px',
          boxSizing: 'border-box',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          fontFamily: "'Sora', 'Manrope', sans-serif",
          background:
            'radial-gradient(1400px 800px at 50% 0%, #142033 0%, transparent 55%), radial-gradient(900px 600px at 10% 100%, rgba(212,175,55,0.10), transparent 60%), linear-gradient(160deg, #060912 0%, #0a1428 55%, #060912 100%)',
          color: '#f1e9d2',
          zIndex: -1,
        }}
      >
        <div
          style={{
            border: '1px solid rgba(212,175,55,0.55)',
            boxShadow:
              'inset 0 0 0 1px rgba(212,175,55,0.15), inset 0 0 0 10px rgba(255,255,255,0.02), 0 0 80px rgba(212,175,55,0.12)',
            borderRadius: '2px',
            padding: '40px 56px',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Corner ornaments */}
          {[
            { top: 14, left: 14, br: '2px 0 0 0' },
            { top: 14, right: 14, br: '0 2px 0 0' },
            { bottom: 14, left: 14, br: '0 0 0 2px' },
            { bottom: 14, right: 14, br: '0 0 2px 0' },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '48px',
                height: '48px',
                border: '1px solid rgba(212,175,55,0.7)',
                borderRadius: s.br,
                borderTop: (s as any).top !== undefined ? '1px solid rgba(212,175,55,0.7)' : 'none',
                borderBottom: (s as any).bottom !== undefined ? '1px solid rgba(212,175,55,0.7)' : 'none',
                borderLeft: (s as any).left !== undefined ? '1px solid rgba(212,175,55,0.7)' : 'none',
                borderRight: (s as any).right !== undefined ? '1px solid rgba(212,175,55,0.7)' : 'none',
                zIndex: 2,
                ...s,
              }}
            />
          ))}

          {/* Watermark logo */}
          <img
            src={logoDataUrl || universityLogo}
            alt=""
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '560px',
              height: '560px',
              objectFit: 'contain',
              opacity: 0.07,
              filter: 'sepia(1) saturate(4) hue-rotate(0deg) brightness(1.1)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
            <img src={logoDataUrl || universityLogo} alt="University Logo" style={{ height: '84px', objectFit: 'contain', filter: 'drop-shadow(0 0 14px rgba(212,175,55,0.55))' }} />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', margin: 0, fontWeight: 700, letterSpacing: '2px', color: '#faf5e6' }}>Sharnbasva University</h1>
              <h2 style={{ fontSize: '17px', color: '#e8dcb0', margin: '4px 0 0 0', fontWeight: 400, fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>Faculty of Engineering & Technology</h2>
              <p style={{ fontSize: '12px', color: '#a89968', margin: '6px 0 0 0', letterSpacing: '4px', textTransform: 'uppercase' }}>Department of Computer Science & Design</p>
            </div>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '52px', color: '#faf5e6', margin: '4px 0', letterSpacing: '12px', paddingBottom: '6px', position: 'relative', zIndex: 1, fontStyle: 'italic', fontWeight: 500, textShadow: '0 2px 20px rgba(212,175,55,0.25)' }}>
            Certificate of Completion
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '-2px 0 4px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '120px', height: '1px', background: 'linear-gradient(90deg, transparent, #d4af37)' }} />
            <div style={{ width: '6px', height: '6px', background: '#d4af37', transform: 'rotate(45deg)' }} />
            <div style={{ width: '120px', height: '1px', background: 'linear-gradient(90deg, #d4af37, transparent)' }} />
          </div>

          <p style={{ fontSize: '14px', color: '#a89968', margin: '6px 0', letterSpacing: '6px', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
            This is to certify that
          </p>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '48px', margin: '2px 0', fontStyle: 'italic', fontWeight: 700, color: '#faf5e6', position: 'relative', zIndex: 1, textShadow: '0 2px 24px rgba(212,175,55,0.35)' }}>
            {studentName}
          </h2>

          <p style={{ fontSize: '16px', color: '#d9cfa8', margin: '6px 0', textAlign: 'center', maxWidth: '800px', position: 'relative', zIndex: 1, fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
            has successfully completed the assessment for
            <br />
            <strong style={{ color: '#f5d67a', fontSize: '28px', display: 'inline-block', marginTop: '8px', fontFamily: "'Playfair Display', serif", fontWeight: 600, fontStyle: 'normal', letterSpacing: '1px' }}>{quizTitle}</strong>
          </p>

          <div style={{ display: 'flex', gap: '40px', margin: '10px 0 0', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.35)', padding: '14px 44px', borderRadius: '2px', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#a89968', textTransform: 'uppercase', letterSpacing: '4px' }}>Score</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '28px', fontWeight: 700, color: '#f5d67a', fontFamily: "'Playfair Display', serif" }}>{score} / {totalMarks}</p>
            </div>
            <div style={{ width: '1px', background: 'linear-gradient(180deg, transparent, rgba(212,175,55,0.6), transparent)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#a89968', textTransform: 'uppercase', letterSpacing: '4px' }}>Percentage</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '28px', fontWeight: 700, color: '#f5d67a', fontFamily: "'Playfair Display', serif" }}>{percentage}%</p>
            </div>
          </div>

          {/* Date + QR row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: '16px', padding: '14px 20px 0', borderTop: '1px solid rgba(212,175,55,0.25)', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid rgba(212,175,55,0.5)', width: '220px', marginBottom: '8px', paddingBottom: '6px', fontSize: '17px', color: '#f1e9d2', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
                {format(date, 'MMMM do, yyyy')}
              </div>
              <p style={{ margin: 0, fontSize: '10px', color: '#a89968', letterSpacing: '4px', textTransform: 'uppercase' }}>Date of Completion</p>
            </div>

            {/* QR Code for verification */}
            <div style={{ textAlign: 'center' }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Verify QR" style={{ width: '96px', height: '96px', padding: '6px', background: '#faf5e6', borderRadius: '2px', border: '1px solid rgba(212,175,55,0.5)', boxShadow: '0 0 24px rgba(212,175,55,0.3)' }} />
              ) : (
                <div style={{ width: '96px', height: '96px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '2px' }} />
              )}
              <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: '#a89968', letterSpacing: '4px', textTransform: 'uppercase' }}>Scan to verify</p>
              {certificateId && (
                <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: '#f5d67a', letterSpacing: '2px', fontFamily: "'Courier New', monospace", wordBreak: 'break-all', maxWidth: '160px' }}>
                  ID: {certificateId}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
