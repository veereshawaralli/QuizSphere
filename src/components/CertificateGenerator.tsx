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

  // Candy Cosmos palette — premium, vibrant, print-safe.
  const canvas = '#FBF7FF';
  const ink = '#1A0B2E';
  const inkSoft = '#3B2A5A';
  const muted = '#7B6B96';
  const hairline = '#E5DCF5';
  const violet = '#7C3AED';
  const pink = '#FF006E';
  const cyan = '#06B6D4';
  const tangerine = '#FB923C';
  const candyGradient = `linear-gradient(135deg, ${violet} 0%, ${pink} 55%, ${tangerine} 100%)`;

  const issueNo = (submissionId || '').replace(/-/g, '').slice(0, 8).toUpperCase() || '————————';
  const dateLine = format(date, 'dd MMMM yyyy').toUpperCase();
  const yearMark = format(date, 'yyyy');
  const standing =
    percentage >= 90 ? 'Distinction' :
    percentage >= 80 ? 'First Class' :
    'Pass with Merit';
  const verifyShortId = (certificateId || submissionId || '').slice(0, 8).toUpperCase();

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
          backgroundColor: canvas,
          boxSizing: 'border-box',
          flexDirection: 'column',
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
          color: ink,
          zIndex: -1,
          overflow: 'hidden',
          padding: '0',
        }}
      >
        {/* === LEFT VERTICAL RAIL === */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: '52px',
          background: candyGradient,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '36px 0',
          zIndex: 3,
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '9px', letterSpacing: '0.4em', color: '#FFFFFF',
            writingMode: 'vertical-rl', transform: 'rotate(180deg)',
            fontWeight: 700, textTransform: 'uppercase',
          }}>
            Sharnbasva University · Computer Science &amp; Design
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '9px', letterSpacing: '0.4em', color: '#FFFFFF',
            writingMode: 'vertical-rl', transform: 'rotate(180deg)',
            fontWeight: 700,
          }}>
            № {issueNo}
          </span>
        </div>

        {/* === CONTENT FRAME === */}
        <div style={{
          position: 'absolute', top: '24px', right: '24px', bottom: '24px', left: '76px',
          border: `1.5px solid ${hairline}`,
          borderRadius: '20px',
          backgroundColor: canvas,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Decorative corner orbs (subtle, print-safe) */}
          <div style={{
            position: 'absolute', top: '-140px', right: '-140px',
            width: '380px', height: '380px', borderRadius: '50%',
            background: `radial-gradient(circle, ${pink}33 0%, ${violet}11 50%, transparent 75%)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-160px', left: '-100px',
            width: '380px', height: '380px', borderRadius: '50%',
            background: `radial-gradient(circle, ${cyan}22 0%, ${violet}11 50%, transparent 75%)`,
            pointerEvents: 'none',
          }} />

          {/* === HEADER === */}
          <div style={{
            position: 'relative', zIndex: 2,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '32px 48px 24px',
            borderBottom: `1px solid ${hairline}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                height: '48px', width: '48px',
                borderRadius: '12px',
                border: `1.5px solid ${hairline}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#FFFFFF',
              }}>
                <img
                  src={logoDataUrl || universityLogo}
                  alt="Sharnbasva University"
                  style={{ height: '32px', width: '32px', objectFit: 'contain' }}
                />
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <p style={{
                  margin: 0, fontSize: '15px',
                  fontFamily: "'Sora', 'Inter', sans-serif",
                  fontWeight: 700, color: ink, letterSpacing: '-0.015em',
                }}>
                  Sharnbasva University
                </p>
                <p style={{
                  margin: '3px 0 0',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '8px', letterSpacing: '0.28em',
                  textTransform: 'uppercase', color: muted,
                }}>
                  Department of Computer Science &amp; Design
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: pink }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: violet }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cyan }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: tangerine }} />
              <span style={{
                marginLeft: '12px',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '9px', letterSpacing: '0.26em',
                textTransform: 'uppercase', color: muted, fontWeight: 700,
              }}>
                Issued · {dateLine}
              </span>
            </div>
          </div>

          {/* === BODY === */}
          <div style={{
            position: 'relative', zIndex: 2, flex: 1,
            padding: '40px 56px 28px',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* EYEBROW */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ height: '1px', width: '36px', background: pink }} />
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '10px', letterSpacing: '0.34em',
                textTransform: 'uppercase', color: violet, fontWeight: 700,
              }}>
                Certificate of Achievement · {yearMark}
              </span>
              <span style={{ height: '1px', flex: 1, background: hairline }} />
            </div>

            {/* HEADLINE */}
            <h1 style={{
              margin: '20px 0 0',
              fontFamily: "'Sora', 'Inter', sans-serif",
              fontWeight: 800, fontSize: '60px', lineHeight: 1.0,
              color: ink, letterSpacing: '-0.035em',
            }}>
              This is to certify that
            </h1>

            {/* RECIPIENT NAME */}
            <div style={{ marginTop: '28px' }}>
              <h2 style={{
                margin: 0,
                fontFamily: "'Caveat', cursive",
                fontWeight: 700, fontSize: '88px', lineHeight: 1,
                color: pink, letterSpacing: '-0.01em',
                display: 'inline-block',
                paddingBottom: '6px',
                borderBottom: `2px solid ${ink}`,
              }}>
                {studentName}
              </h2>
              {studentUsn && (
                <p style={{
                  margin: '14px 0 0',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '11px', letterSpacing: '0.22em',
                  color: inkSoft, textTransform: 'uppercase',
                }}>
                  University Seat No · <span style={{ color: ink, fontWeight: 700 }}>{studentUsn}</span>
                </p>
              )}
            </div>

            {/* CITATION */}
            <p style={{
              margin: '24px 0 0',
              fontSize: '14px', lineHeight: 1.6,
              color: inkSoft, maxWidth: '620px',
            }}>
              has successfully completed the assessment and demonstrated
              proficiency in the subject below, in accordance with the academic
              standards of the Department of Computer Science &amp; Design.
            </p>

            {/* QUIZ TITLE BAND */}
            <div style={{
              marginTop: '20px',
              padding: '18px 22px',
              borderRadius: '14px',
              border: `1.5px solid ${hairline}`,
              borderLeft: `4px solid ${violet}`,
              backgroundColor: '#FFFFFF',
              maxWidth: '620px',
            }}>
              <p style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '9px', letterSpacing: '0.3em',
                textTransform: 'uppercase', color: violet, fontWeight: 700,
              }}>
                Assessment Title
              </p>
              <p style={{
                margin: '6px 0 0',
                fontFamily: "'Sora', 'Inter', sans-serif",
                fontWeight: 700, fontSize: '22px', lineHeight: 1.25,
                color: ink, letterSpacing: '-0.015em',
              }}>
                {quizTitle}
              </p>
            </div>

            {/* SCORE STRIP */}
            <div style={{
              marginTop: 'auto',
              paddingTop: '24px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              borderTop: `1px solid ${hairline}`,
            }}>
              {/* Score */}
              <div style={{ borderRight: `1px solid ${hairline}`, paddingRight: '20px' }}>
                <p style={{
                  margin: 0,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '9px', letterSpacing: '0.3em',
                  textTransform: 'uppercase', color: muted, fontWeight: 700,
                }}>
                  Score
                </p>
                <p style={{
                  margin: '8px 0 0',
                  fontFamily: "'Sora', 'Inter', sans-serif",
                  fontWeight: 800, fontSize: '40px', lineHeight: 1,
                  color: ink, letterSpacing: '-0.03em',
                }}>
                  {score}
                  <span style={{ color: muted, fontSize: '20px', fontWeight: 500 }}>
                    {' '}/ {totalMarks}
                  </span>
                </p>
              </div>
              {/* Percentage */}
              <div style={{ borderRight: `1px solid ${hairline}`, paddingLeft: '24px', paddingRight: '20px' }}>
                <p style={{
                  margin: 0,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '9px', letterSpacing: '0.3em',
                  textTransform: 'uppercase', color: muted, fontWeight: 700,
                }}>
                  Percentage
                </p>
                <p style={{
                  margin: '8px 0 0',
                  fontFamily: "'Sora', 'Inter', sans-serif",
                  fontWeight: 800, fontSize: '40px', lineHeight: 1,
                  color: pink, letterSpacing: '-0.03em',
                }}>
                  {percentage}
                  <span style={{ color: violet, fontSize: '24px' }}>%</span>
                </p>
              </div>
              {/* Standing */}
              <div style={{ paddingLeft: '24px' }}>
                <p style={{
                  margin: 0,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '9px', letterSpacing: '0.3em',
                  textTransform: 'uppercase', color: muted, fontWeight: 700,
                }}>
                  Standing
                </p>
                <span style={{
                  marginTop: '8px',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '999px',
                  background: candyGradient, color: '#FFFFFF',
                  fontFamily: "'Sora', 'Inter', sans-serif",
                  fontWeight: 700, fontSize: '14px',
                  letterSpacing: '-0.005em',
                }}>
                  ★ {standing}
                </span>
              </div>
            </div>
          </div>

          {/* === FOOTER === */}
          <div style={{
            position: 'relative', zIndex: 2,
            padding: '20px 48px 28px',
            borderTop: `1px solid ${hairline}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            backgroundColor: '#FFFFFF',
          }}>
            {/* Signature block */}
            <div>
              <div style={{
                fontFamily: "'Caveat', cursive",
                fontWeight: 700, fontSize: '32px', color: violet,
                lineHeight: 1, marginBottom: '4px',
              }}>
                CSD Portal
              </div>
              <div style={{
                height: '1px', width: '180px', background: ink, marginBottom: '8px',
              }} />
              <p style={{
                margin: 0,
                fontFamily: "'Sora', 'Inter', sans-serif",
                fontWeight: 700, fontSize: '12px', color: ink,
                letterSpacing: '-0.01em',
              }}>
                Department of Computer Science &amp; Design
              </p>
              <p style={{
                margin: '2px 0 0',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '8px', letterSpacing: '0.24em',
                textTransform: 'uppercase', color: muted,
              }}>
                Sharnbasva University · Kalaburagi
              </p>
            </div>

            {/* Date column */}
            <div style={{ textAlign: 'center' }}>
              <p style={{
                margin: 0,
                fontFamily: "'Sora', 'Inter', sans-serif",
                fontWeight: 700, fontSize: '14px', color: ink,
              }}>
                {format(date, 'MMMM d, yyyy')}
              </p>
              <div style={{
                margin: '6px auto 0',
                height: '1px', width: '140px', background: ink,
              }} />
              <p style={{
                margin: '8px 0 0',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '8px', letterSpacing: '0.28em',
                textTransform: 'uppercase', color: muted, fontWeight: 700,
              }}>
                Date of Issue
              </p>
            </div>

            {/* QR + verify ID */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{
                  margin: 0,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '8px', letterSpacing: '0.28em',
                  textTransform: 'uppercase', color: violet, fontWeight: 700,
                }}>
                  Scan to verify
                </p>
                <p style={{
                  margin: '4px 0 0',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '10px', letterSpacing: '0.14em',
                  color: ink, fontWeight: 700,
                }}>
                  ID · {verifyShortId}
                </p>
              </div>
              <div style={{
                padding: '3px', borderRadius: '12px', background: candyGradient,
              }}>
                <div style={{
                  padding: '6px', borderRadius: '9px', backgroundColor: '#FFFFFF',
                }}>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Verify QR" style={{ width: '76px', height: '76px', display: 'block' }} />
                  ) : (
                    <div style={{ width: '76px', height: '76px', backgroundColor: hairline }} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
