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

  // Editorial palette — mirrors the site's warm paper / deep ink / electric coral system.
  const paper = '#F4EEE3';        // warm paper background
  const paperDeep = '#EDE5D5';    // subtle paper shadow tone
  const ink = '#10131F';          // deep ink (near-black indigo)
  const inkSoft = '#2A2E3D';      // softer ink for secondary text
  const muted = '#6B6B72';        // muted body text
  const hairline = '#1A1D2A';     // dark hairline rules
  const coral = '#EF4D2C';        // single bold accent

  const issueNo = (submissionId || '').replace(/-/g, '').slice(0, 6).toUpperCase() || '——————';
  const dateLine = format(date, 'dd MMM yyyy').toUpperCase();
  const yearMark = format(date, 'yyyy');

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
          backgroundColor: paper,
          boxSizing: 'border-box',
          flexDirection: 'column',
          fontFamily: "'Space Grotesk', 'Segoe UI', Arial, sans-serif",
          color: ink,
          zIndex: -1,
          overflow: 'hidden',
          padding: '56px 64px',
          position: 'fixed',
        }}
      >
        {/* Outer editorial frame — single hairline */}
        <div style={{
          position: 'absolute',
          inset: '32px',
          border: `1px solid ${hairline}`,
          pointerEvents: 'none',
        }} />
        {/* Coral seal mark — top-right corner of the frame */}
        <div style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          width: '16px',
          height: '16px',
          backgroundColor: coral,
        }} />

        {/* TOP META ROW */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '18px',
          borderBottom: `1px solid ${hairline}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={logoDataUrl || universityLogo}
              alt="Sharnbasva University"
              style={{ height: '40px', width: '40px', objectFit: 'contain' }}
            />
            <div style={{ lineHeight: 1.2 }}>
              <p style={{
                margin: 0,
                fontSize: '15px',
                fontFamily: "'DM Serif Display', Georgia, serif",
                color: ink,
                letterSpacing: '-0.01em',
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
            <span style={{ color: coral }}>●</span>
            <span>Issued · {dateLine}</span>
          </div>
        </div>

        {/* HEADLINE BAND — eyebrow + oversized year */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginTop: '24px',
        }}>
          <div>
            <p style={{
              margin: 0,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '10px',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: coral,
            }}>
              § Certificate of Achievement
            </p>
            <h1 style={{
              margin: '10px 0 0',
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: '76px',
              lineHeight: 0.95,
              color: ink,
              letterSpacing: '-0.02em',
            }}>
              Awarded, <br />
              with distinction<span style={{ color: coral }}>.</span>
            </h1>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{
              margin: 0,
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: '88px',
              lineHeight: 0.9,
              color: ink,
              letterSpacing: '-0.04em',
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
          marginTop: '36px',
          display: 'grid',
          gridTemplateColumns: '1.55fr 1fr',
          gap: '40px',
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
                margin: '12px 0 0',
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '54px',
                lineHeight: 1.05,
                color: ink,
                letterSpacing: '-0.02em',
              }}>
                {studentName}
              </h2>
              {studentUsn && (
                <p style={{
                  margin: '10px 0 0',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  color: inkSoft,
                }}>
                  USN · <span style={{ color: ink, fontWeight: 600 }}>{studentUsn}</span>
                </p>
              )}
            </div>

            {/* hairline with coral seed */}
            <div style={{ position: 'relative', height: '1px', backgroundColor: hairline, width: '70%' }}>
              <span style={{
                position: 'absolute',
                left: 0, top: '-2px',
                width: '40px', height: '3px',
                backgroundColor: coral,
              }} />
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
              <p style={{
                margin: '14px 0 0',
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '26px',
                lineHeight: 1.15,
                color: ink,
                letterSpacing: '-0.01em',
                fontStyle: 'italic',
              }}>
                “{quizTitle}”
              </p>
            </div>
          </div>

          {/* RIGHT — score column */}
          <div style={{
            borderLeft: `1px solid ${hairline}`,
            paddingLeft: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
          }}>
            <div>
              <p style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '9px',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: muted,
              }}>
                01 — Score
              </p>
              <p style={{
                margin: '8px 0 0',
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '44px',
                lineHeight: 1,
                color: ink,
                letterSpacing: '-0.02em',
              }}>
                {score}<span style={{ color: muted, fontSize: '24px' }}> / {totalMarks}</span>
              </p>
            </div>

            <div>
              <p style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '9px',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: muted,
              }}>
                02 — Percentage
              </p>
              <p style={{
                margin: '8px 0 0',
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '76px',
                lineHeight: 0.9,
                color: coral,
                letterSpacing: '-0.04em',
              }}>
                {percentage}<span style={{ fontSize: '34px', color: ink }}>%</span>
              </p>
            </div>

            <div>
              <p style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '9px',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: muted,
              }}>
                03 — Standing
              </p>
              <p style={{
                margin: '8px 0 0',
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '24px',
                lineHeight: 1.1,
                color: ink,
              }}>
                {percentage >= 90 ? 'Distinction' : percentage >= 80 ? 'First Class' : 'Pass with Merit'}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          marginTop: '20px',
          paddingTop: '18px',
          borderTop: `1px solid ${hairline}`,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          alignItems: 'flex-end',
          gap: '32px',
        }}>
          <div>
            <p style={{
              margin: 0,
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: '20px',
              color: ink,
            }}>
              {format(date, 'MMMM d, yyyy')}
            </p>
            <div style={{ height: '1px', width: '60%', backgroundColor: hairline, margin: '8px 0' }} />
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
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: '20px',
              color: ink,
            }}>
              CSD Portal
            </p>
            <div style={{ height: '1px', width: '60%', backgroundColor: hairline, margin: '8px 0' }} />
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
                color: muted,
              }}>
                Scan to verify
              </p>
              <p style={{
                margin: '4px 0 0',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '10px',
                color: ink,
                letterSpacing: '0.12em',
              }}>
                {(certificateId || submissionId || '').slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div style={{
              padding: '6px',
              backgroundColor: paperDeep,
              border: `1px solid ${hairline}`,
            }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Verify QR" style={{ width: '78px', height: '78px', display: 'block' }} />
              ) : (
                <div style={{ width: '78px', height: '78px', backgroundColor: paperDeep }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
