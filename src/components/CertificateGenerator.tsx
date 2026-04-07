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
  studentUsn: string;
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
  studentUsn,
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

  if (!eligible) return null;

  const getOrCreateCertificate = async (): Promise<string> => {
    if (certificateId) return certificateId;
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
      const certId = await getOrCreateCertificate();
      const verifyUrl = `${window.location.origin}/verify/${certId}`;
      const qrUrl = await QRCode.toDataURL(verifyUrl, { width: 140, margin: 1 });
      setQrDataUrl(qrUrl);
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

  // Website theme colors
  const indigo = '#2d3561';
  const indigoDark = '#1e2544';
  const teal = '#14b8a6';
  const tealLight = '#5eead4';
  const white = '#ffffff';
  const slate100 = '#f1f5f9';
  const slate300 = '#cbd5e1';
  const slate500 = '#64748b';

  return (
    <>
      <Button onClick={handleDownload} disabled={isGenerating} className="gap-2 w-full sm:w-auto">
        {isGenerating ? <Award className="h-4 w-4 animate-pulse" /> : <Download className="h-4 w-4" />}
        {isGenerating ? 'Generating...' : 'Download Certificate'}
      </Button>

      {/* Hidden Certificate DOM */}
      <div
        ref={certificateRef}
        style={{
          display: 'none',
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1056px',
          height: '816px',
          backgroundColor: white,
          boxSizing: 'border-box',
          flexDirection: 'column',
          fontFamily: "'Space Grotesk', 'Segoe UI', Arial, sans-serif",
          zIndex: -1,
          overflow: 'hidden',
        }}
      >
        {/* Top indigo header band */}
        <div style={{
          height: '80px',
          background: `linear-gradient(135deg, ${indigoDark} 0%, ${indigo} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '0 40px',
        }}>
          <img src={logoDataUrl || universityLogo} alt="Logo" style={{ height: '52px', width: '52px', objectFit: 'contain', borderRadius: '50%', border: `2px solid ${teal}` }} />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '22px', color: white, margin: 0, fontWeight: 700, letterSpacing: '2px', fontFamily: "'DM Serif Display', Georgia, serif" }}>
              SHARNBASVA UNIVERSITY
            </h1>
            <p style={{ fontSize: '11px', color: tealLight, margin: '2px 0 0', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 500 }}>
              Department of Computer Science & Design
            </p>
          </div>
        </div>

        {/* Teal accent line */}
        <div style={{ height: '4px', background: `linear-gradient(90deg, ${teal}, ${tealLight}, ${teal})` }} />

        {/* Main body */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 60px 20px',
          boxSizing: 'border-box',
          position: 'relative',
        }}>
          {/* Corner decorations */}
          <div style={{ position: 'absolute', top: '20px', left: '20px', width: '40px', height: '40px', borderTop: `3px solid ${teal}`, borderLeft: `3px solid ${teal}` }} />
          <div style={{ position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderTop: `3px solid ${teal}`, borderRight: `3px solid ${teal}` }} />
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', width: '40px', height: '40px', borderBottom: `3px solid ${teal}`, borderLeft: `3px solid ${teal}` }} />
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '40px', height: '40px', borderBottom: `3px solid ${teal}`, borderRight: `3px solid ${teal}` }} />

          {/* Award icon area */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${teal}, ${tealLight})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '28px', color: white }}>★</span>
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: '38px',
            color: indigo,
            margin: '0',
            fontWeight: 700,
            letterSpacing: '8px',
            textTransform: 'uppercase',
            fontFamily: "'DM Serif Display', Georgia, serif",
          }}>
            Certificate
          </h2>
          <p style={{
            fontSize: '16px',
            color: teal,
            margin: '2px 0 0',
            letterSpacing: '6px',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            of Achievement
          </p>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '60%', margin: '14px 0' }}>
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right, transparent, ${slate300})` }} />
            <div style={{ width: '10px', height: '10px', backgroundColor: teal, transform: 'rotate(45deg)' }} />
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(to left, transparent, ${slate300})` }} />
          </div>

          {/* Certify text */}
          <p style={{ fontSize: '14px', color: slate500, margin: '0', letterSpacing: '1px' }}>
            This is to certify that
          </p>

          {/* Student Name */}
          <h3 style={{
            fontSize: '36px',
            color: indigo,
            margin: '6px 0 0',
            fontWeight: 700,
            fontFamily: "'DM Serif Display', Georgia, serif",
            lineHeight: 1.2,
          }}>
            {studentName}
          </h3>
          <div style={{ width: '250px', height: '3px', background: `linear-gradient(90deg, transparent, ${teal}, transparent)`, margin: '4px 0' }} />

          {/* USN */}
          {studentUsn && (
            <p style={{
              fontSize: '14px',
              color: slate500,
              margin: '4px 0 0',
              letterSpacing: '2px',
            }}>
              USN: <strong style={{ color: indigo, fontWeight: 700 }}>{studentUsn}</strong>
            </p>
          )}

          {/* Description */}
          <p style={{ fontSize: '14px', color: slate500, margin: '12px 0 0', textAlign: 'center' }}>
            has successfully completed the assessment
          </p>
          <p style={{
            fontSize: '22px',
            color: indigo,
            margin: '4px 0 0',
            fontWeight: 600,
            textAlign: 'center',
            fontFamily: "'DM Serif Display', Georgia, serif",
          }}>
            "{quizTitle}"
          </p>

          {/* Score cards */}
          <div style={{ display: 'flex', gap: '20px', margin: '16px 0 0' }}>
            <div style={{
              textAlign: 'center',
              padding: '10px 32px',
              borderRadius: '10px',
              border: `2px solid ${slate300}`,
              backgroundColor: slate100,
            }}>
              <p style={{ margin: 0, fontSize: '10px', color: slate500, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Score</p>
              <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 700, color: indigo }}>{score} / {totalMarks}</p>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '10px 32px',
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${indigo}, ${indigoDark})`,
            }}>
              <p style={{ margin: 0, fontSize: '10px', color: tealLight, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Percentage</p>
              <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 700, color: white }}>{percentage}%</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: `2px solid ${slate300}`,
          margin: '0 40px',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '16px', color: indigo, fontWeight: 700 }}>
              {format(date, 'MMMM do, yyyy')}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '10px', color: slate500, textTransform: 'uppercase', letterSpacing: '2px' }}>Date of Completion</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '12px', color: indigo, fontWeight: 600 }}>CSD Quiz & Learning Portal</p>
            <p style={{ margin: '2px 0 0', fontSize: '10px', color: slate500 }}>Sharnbasva University, Kalaburagi</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Verify QR" style={{ width: '72px', height: '72px', borderRadius: '6px', border: `1px solid ${slate300}` }} />
            ) : (
              <div style={{ width: '72px', height: '72px', backgroundColor: slate100, borderRadius: '6px' }} />
            )}
            <p style={{ margin: '2px 0 0', fontSize: '9px', color: slate500 }}>Scan to verify</p>
          </div>
        </div>

        {/* Bottom accent band */}
        <div style={{
          height: '10px',
          background: `linear-gradient(135deg, ${indigoDark} 0%, ${indigo} 40%, ${teal} 60%, ${tealLight} 100%)`,
        }} />
      </div>
    </>
  );
}
