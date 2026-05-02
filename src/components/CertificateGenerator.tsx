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
  const canvas = '#FBF7FF';       // soft lilac-white base (prints clean)
  const ink = '#1A0B2E';          // deep plum ink
  const inkSoft = '#3B2A5A';      // softer plum
  const muted = '#7B6B96';        // muted lavender body
  const hairline = '#E5DCF5';     // soft hairline
  const violet = '#7C3AED';       // electric violet (primary)
  const pink = '#FF006E';         // hot pink (accent)
  const cyan = '#06B6D4';         // cyan extra
  const lime = '#A3E635';         // lime extra
  const tangerine = '#FB923C';    // tangerine extra
  const candyGradient = `linear-gradient(135deg, ${violet} 0%, ${pink} 55%, ${tangerine} 100%)`;
  const auroraGradient = `linear-gradient(120deg, ${cyan} 0%, ${violet} 50%, ${pink} 100%)`;

  const issueNo = (submissionId || '').replace(/-/g, '').slice(0, 6).toUpperCase() || '——————';
  const dateLine = format(date, 'dd MMM yyyy').toUpperCase();
  const yearMark = format(date, 'yyyy');
  const standing = percentage >= 90 ? 'Distinction' : percentage >= 80 ? 'First Class' : 'Pass with Merit';

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
          padding: '52px 60px',
        }}
      >
        {/* Aurora blobs — soft, abstract, brand-defining */}
        <div style={{
          position: 'absolute', top: '-180px', right: '-160px',
          width: '520px', height: '520px', borderRadius: '50%',
          background: `radial-gradient(circle, ${pink}55 0%, ${violet}22 45%, transparent 70%)`,
          filter: 'blur(2px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-200px', left: '-180px',
          width: '560px', height: '560px', borderRadius: '50%',
          background: `radial-gradient(circle, ${cyan}44 0%, ${violet}33 45%, transparent 70%)`,
          filter: 'blur(2px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '45%',
          width: '320px', height: '320px', borderRadius: '50%',
          background: `radial-gradient(circle, ${lime}22 0%, transparent 70%)`,
          filter: 'blur(2px)', pointerEvents: 'none',
        }} />

        {/* Outer gradient frame */}
        <div style={{
          position: 'absolute', inset: '24px', borderRadius: '28px',
          padding: '2px', background: candyGradient,
          pointerEvents: 'none',
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '26px',
            backgroundColor: canvas,
          }} />
        </div>

        {/* Corner candy dots */}
        <div style={{ position: 'absolute', top: '48px', right: '48px', display: 'flex', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: pink }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: violet }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cyan }} />
        </div>

        {/* Content wrapper above decorations */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, zIndex: 2 }}>

        {/* TOP META ROW */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '18px',
          borderBottom: `1px solid ${hairline}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              position: 'relative', height: '52px', width: '52px',
              borderRadius: '14px', padding: '2px',
              background: candyGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                height: '100%', width: '100%', borderRadius: '12px',
                background: canvas,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img
                  src={logoDataUrl || universityLogo}
                  alt="Sharnbasva University"
                  style={{ height: '36px', width: '36px', objectFit: 'contain' }}
                />
              </div>
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <p style={{
                margin: 0,
                fontSize: '17px',
                fontFamily: "'Sora', 'Inter', sans-serif",
                fontWeight: 700,
                color: ink,
                letterSpacing: '-0.02em',
              }}>
                Sharnbasva University
              </p>
              <p style={{
                margin: '2px 0 0',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '9px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: muted,
              }}>
                Computer Science &amp; Design
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '9px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: muted,
          }}>
            <span>№ {issueNo}</span>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: candyGradient, display: 'inline-block',
            }} />
            <span>Issued · {dateLine}</span>
          </div>
        </div>

        {/* HEADLINE BAND — eyebrow + oversized year */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginTop: '28px',
        }}>
          <div>
            <p style={{
              margin: 0,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '10px',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: violet,
              fontWeight: 700,
            }}>
              ✦ Certificate of Achievement
            </p>
            <h1 style={{
              margin: '12px 0 0',
              fontFamily: "'Sora', 'Inter', sans-serif",
              fontWeight: 800,
              fontSize: '70px',
              lineHeight: 0.95,
              color: ink,
              letterSpacing: '-0.035em',
            }}>
              Awarded,<br />
              with{' '}
              <span style={{
                color: pink,
                fontStyle: 'italic',
                fontFamily: "'Caveat', cursive",
                fontWeight: 700,
                fontSize: '82px',
                lineHeight: 1,
                display: 'inline-block',
                verticalAlign: 'baseline',
              }}>brilliance</span>
              <span style={{ color: pink }}>.</span>
            </h1>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{
              margin: 0,
              fontFamily: "'Sora', 'Inter', sans-serif",
              fontWeight: 800,
              fontSize: '92px',
              lineHeight: 0.9,
              letterSpacing: '-0.05em',
              color: violet,
            }}>
              {yearMark}
            </p>
            <p style={{
              margin: '4px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '9px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: muted,
            }}>
              Academic Year
            </p>
          </div>
        </div>

        {/* MAIN GRID — name & quiz on left, meta column on right */}
        <div style={{
          marginTop: '32px',
          display: 'grid',
          gridTemplateColumns: '1.55fr 1fr',
          gap: '36px',
          alignItems: 'flex-start',
          flex: 1,
        }}>
          {/* LEFT — recipient & subject */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <p style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '10px',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: muted,
              }}>
                Presented to
              </p>
              <h2 style={{
                margin: '10px 0 0',
                fontFamily: "'Sora', 'Inter', sans-serif",
                fontWeight: 700,
                fontSize: '52px',
                lineHeight: 1.05,
                color: ink,
                letterSpacing: '-0.025em',
              }}>
                {studentName}
              </h2>
              {/* gradient underline */}
              <div style={{
                marginTop: '10px', height: '4px', width: '120px',
                borderRadius: '999px', background: candyGradient,
              }} />
              {studentUsn && (
                <p style={{
                  margin: '14px 0 0',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  color: inkSoft,
                }}>
                  USN · <span style={{ color: ink, fontWeight: 600 }}>{studentUsn}</span>
                </p>
              )}
            </div>

            <div>
              <p style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: 1.55,
                color: inkSoft,
                maxWidth: '440px',
              }}>
                For the successful completion of the assessment titled below,
                meeting the standards set by the Department of Computer Science
                &amp; Design.
              </p>
              <div style={{
                marginTop: '16px',
                padding: '16px 20px',
                borderRadius: '18px',
                border: `1.5px solid ${hairline}`,
                background: `linear-gradient(135deg, ${violet}0D 0%, ${pink}0D 100%)`,
                position: 'relative',
              }}>
                <span style={{
                  position: 'absolute', top: '-1px', left: '20px', height: '2px', width: '50px',
                  background: candyGradient, borderRadius: '999px',
                }} />
                <p style={{
                  margin: 0,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '8px', letterSpacing: '0.3em', textTransform: 'uppercase',
                  color: violet, fontWeight: 700,
                }}>
                  Assessment
                </p>
                <p style={{
                  margin: '6px 0 0',
                  fontFamily: "'Sora', 'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: '24px',
                  lineHeight: 1.2,
                  color: ink,
                  letterSpacing: '-0.015em',
                }}>
                  {quizTitle}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — score column */}
          <div style={{
            padding: '24px 26px',
            borderRadius: '24px',
            background: `linear-gradient(160deg, ${canvas} 0%, ${violet}0A 100%)`,
            border: `1.5px solid ${hairline}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* corner accent */}
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '120px', height: '120px', borderRadius: '50%',
              background: candyGradient, opacity: 0.15, filter: 'blur(8px)',
            }} />
            <div>
              <p style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '9px',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: cyan,
                fontWeight: 700,
              }}>
                01 — Score
              </p>
              <p style={{
                margin: '6px 0 0',
                fontFamily: "'Sora', 'Inter', sans-serif",
                fontWeight: 800,
                fontSize: '42px',
                lineHeight: 1,
                color: ink,
                letterSpacing: '-0.03em',
              }}>
                {score}<span style={{ color: muted, fontSize: '22px', fontWeight: 500 }}> / {totalMarks}</span>
              </p>
            </div>

            <div>
              <p style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '9px',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: pink,
                fontWeight: 700,
              }}>
                02 — Percentage
              </p>
              <p style={{
                margin: '6px 0 0',
                fontFamily: "'Sora', 'Inter', sans-serif",
                fontWeight: 800,
                fontSize: '78px',
                lineHeight: 0.9,
                letterSpacing: '-0.05em',
                background: candyGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {percentage}<span style={{ fontSize: '34px' }}>%</span>
              </p>
            </div>

            <div>
              <p style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '9px',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: lime === lime ? '#65A30D' : muted,
                fontWeight: 700,
              }}>
                03 — Standing
              </p>
              <span style={{
                marginTop: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '999px',
                background: candyGradient,
                color: '#FFFFFF',
                fontFamily: "'Sora', 'Inter', sans-serif",
                fontWeight: 700,
                fontSize: '15px',
                letterSpacing: '-0.005em',
                width: 'fit-content',
              }}>
                ★ {standing}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: `1px dashed ${hairline}`,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          alignItems: 'flex-end',
          gap: '32px',
        }}>
          <div>
            <p style={{
              margin: 0,
              fontFamily: "'Sora', 'Inter', sans-serif",
              fontWeight: 700,
              fontSize: '18px',
              color: ink,
              letterSpacing: '-0.015em',
            }}>
              {format(date, 'MMMM d, yyyy')}
            </p>
            <div style={{ height: '2px', width: '50px', background: candyGradient, borderRadius: '999px', margin: '8px 0' }} />
            <p style={{
              margin: 0,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '9px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: muted,
            }}>
              Date of Completion
            </p>
          </div>

          <div>
            <p style={{
              margin: 0,
              fontFamily: "'Sora', 'Inter', sans-serif",
              fontWeight: 700,
              fontSize: '18px',
              color: ink,
              letterSpacing: '-0.015em',
            }}>
              CSD Portal
            </p>
            <div style={{ height: '2px', width: '50px', background: auroraGradient, borderRadius: '999px', margin: '8px 0' }} />
            <p style={{
              margin: 0,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '9px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: muted,
            }}>
              Sharnbasva University · Kalaburagi
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '9px',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: violet,
                fontWeight: 700,
              }}>
                Scan to verify
              </p>
              <p style={{
                margin: '4px 0 0',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '10px',
                color: ink,
                letterSpacing: '0.12em',
                fontWeight: 600,
              }}>
                {(certificateId || submissionId || '').slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div style={{
              padding: '3px',
              borderRadius: '14px',
              background: candyGradient,
            }}>
              <div style={{
                padding: '6px',
                borderRadius: '11px',
                backgroundColor: '#FFFFFF',
              }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Verify QR" style={{ width: '78px', height: '78px', display: 'block' }} />
                ) : (
                  <div style={{ width: '78px', height: '78px', backgroundColor: hairline }} />
                )}
              </div>
            </div>
          </div>
        </div>
        </div>{/* /content wrapper */}
      </div>
    </>
  );
}
