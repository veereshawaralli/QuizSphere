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

  // Color palette
  const indigo = '#2d3561';
  const teal = '#14b8a6';
  const darkText = '#0f172a';
  const mutedText = '#64748b';

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
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          flexDirection: 'column',
          fontFamily: "'Space Grotesk', 'Segoe UI', Arial, sans-serif",
          zIndex: -1,
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <div style={{
          height: '8px',
          background: `linear-gradient(90deg, ${indigo} 0%, ${teal} 50%, ${indigo} 100%)`,
          width: '100%',
        }} />

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: 1,
          padding: '30px 60px 24px',
          boxSizing: 'border-box',
        }}>

          {/* Header: Logo + University */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src={logoDataUrl || universityLogo} alt="Logo" style={{ height: '64px', width: '64px', objectFit: 'contain' }} />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '26px', color: indigo, margin: 0, fontWeight: 700, letterSpacing: '1px', fontFamily: "'DM Serif Display', Georgia, serif" }}>
                SHARNBASVA UNIVERSITY
              </h1>
              <p style={{ fontSize: '13px', color: mutedText, margin: '2px 0 0', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Department of Computer Science & Design
              </p>
            </div>
          </div>

          {/* Decorative divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '70%', margin: '12px 0 4px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            <div style={{ width: '8px', height: '8px', backgroundColor: teal, transform: 'rotate(45deg)' }} />
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: '36px',
            color: indigo,
            margin: '4px 0',
            fontWeight: 700,
            letterSpacing: '6px',
            textTransform: 'uppercase',
            fontFamily: "'DM Serif Display', Georgia, serif",
          }}>
            Certificate
          </h2>
          <p style={{ fontSize: '14px', color: mutedText, margin: 0, letterSpacing: '4px', textTransform: 'uppercase' }}>
            of Achievement
          </p>

          {/* Certify text */}
          <p style={{ fontSize: '15px', color: mutedText, margin: '12px 0 0' }}>
            This is to certify that
          </p>

          {/* Student Name */}
          <h3 style={{
            fontSize: '34px',
            color: indigo,
            margin: '4px 0 0',
            fontWeight: 700,
            fontFamily: "'DM Serif Display', Georgia, serif",
            borderBottom: `3px solid ${teal}`,
            paddingBottom: '4px',
            lineHeight: 1.2,
          }}>
            {studentName}
          </h3>

          {/* USN */}
          {studentUsn && (
            <p style={{ fontSize: '14px', color: mutedText, margin: '4px 0 0', letterSpacing: '1px' }}>
              USN: <strong style={{ color: darkText }}>{studentUsn}</strong>
            </p>
          )}

          {/* Description */}
          <p style={{ fontSize: '15px', color: mutedText, margin: '10px 0 0', textAlign: 'center', maxWidth: '700px', lineHeight: 1.5 }}>
            has successfully completed the assessment
          </p>
          <p style={{
            fontSize: '22px',
            color: darkText,
            margin: '4px 0 0',
            fontWeight: 600,
            textAlign: 'center',
            fontFamily: "'DM Serif Display', Georgia, serif",
          }}>
            "{quizTitle}"
          </p>

          {/* Score cards */}
          <div style={{
            display: 'flex',
            gap: '24px',
            margin: '14px 0 0',
          }}>
            <div style={{
              textAlign: 'center',
              padding: '10px 28px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
            }}>
              <p style={{ margin: 0, fontSize: '11px', color: mutedText, textTransform: 'uppercase', letterSpacing: '1px' }}>Score</p>
              <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 700, color: indigo }}>{score} / {totalMarks}</p>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '10px 28px',
              borderRadius: '8px',
              backgroundColor: indigo,
            }}>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>Percentage</p>
              <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 700, color: '#ffffff' }}>{percentage}%</p>
            </div>
          </div>

          {/* Footer: Date + QR */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            width: '100%',
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: `2px solid ${teal}`,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '16px', color: darkText, fontWeight: 600 }}>
                {format(date, 'MMMM do, yyyy')}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: mutedText, textTransform: 'uppercase', letterSpacing: '1px' }}>Date of Completion</p>
            </div>

            <div style={{ textAlign: 'center', fontSize: '11px', color: mutedText }}>
              <p style={{ margin: 0 }}>CSD Quiz & Learning Portal</p>
              <p style={{ margin: '1px 0 0' }}>Sharnbasva University, Kalaburagi</p>
            </div>

            <div style={{ textAlign: 'center' }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Verify QR" style={{ width: '80px', height: '80px' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
              )}
              <p style={{ margin: '2px 0 0', fontSize: '9px', color: mutedText }}>Scan to verify</p>
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div style={{
          height: '8px',
          background: `linear-gradient(90deg, ${indigo} 0%, ${teal} 50%, ${indigo} 100%)`,
          width: '100%',
        }} />
      </div>
    </>
  );
}
