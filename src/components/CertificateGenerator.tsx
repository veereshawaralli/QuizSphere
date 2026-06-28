import React, { useRef, useState, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Button } from './ui/button';
import { Download, Award } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
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
  const qrImageRef = useRef<HTMLImageElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');

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

  const buildVerificationUrl = useCallback(
    (id: string) => `${window.location.origin}/verify/${id}`,
    []
  );

  // Generate a QR PNG data URL so html2canvas always captures it reliably
  // (canvas capture can silently fail; <img src=data:...> never does).
  const generateQrDataUrl = useCallback(
    async (id: string) => {
      const url = await QRCode.toDataURL(buildVerificationUrl(id), {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 512,
        color: { dark: '#07111F', light: '#FFFFFF' },
      });
      if (qrImageRef.current) qrImageRef.current.src = url;
      setQrImageUrl(url);
      return url;
    },
    [buildVerificationUrl],
  );

  const getOrCreateCertificate = useCallback(async (): Promise<string> => {
    if (certificateId) return certificateId;
    const { data: existing, error: existingError } = await supabase
      .from('certificates')
      .select('id')
      .eq('submission_id', submissionId)
      .maybeSingle();
    if (existingError) throw existingError;
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
  }, [certificateId, submissionId, quizId, studentId, studentName, quizTitle, score, totalMarks, percentage]);

  // Pre-create the certificate row + generate QR on mount so the QR
  // image is ALWAYS embedded before the user clicks Download.
  useEffect(() => {
    if (!eligible || !submissionId) return;
    let cancelled = false;
    (async () => {
      try {
        const id = await getOrCreateCertificate();
        if (cancelled) return;
        await generateQrDataUrl(id);
      } catch (err) {
        console.error('QR pre-generation failed:', err);
        toast.error('Could not prepare verification QR. Please try downloading again.');
      }
    })();
    return () => { cancelled = true; };
  }, [eligible, submissionId, getOrCreateCertificate, generateQrDataUrl]);

  if (!eligible) return null;

  const waitForCertificateImages = async (root: HTMLElement) => {
    const images = Array.from(root.querySelectorAll('img'));
    await Promise.all(images.map(async (image) => {
      if (!image.complete || image.naturalWidth === 0) {
        await new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        });
      }

      if ('decode' in image) {
        try {
          await image.decode();
        } catch {
          // Ignore decode failures and let html2canvas capture the best available state.
        }
      }
    }));
  };

  /**
   * Render the off-screen certificate to a canvas, ensuring the verification QR
   * is committed to the DOM and fully decoded before the snapshot is taken.
   */
  const drawQrOntoCanvas = async (canvas: HTMLCanvasElement, qrDataUrl: string) => {
    if (!certificateRef.current || !qrDataUrl) return;
    const anchor = certificateRef.current.querySelector('[data-qr-anchor]') as HTMLElement | null;
    const ctx = canvas.getContext('2d');
    if (!anchor || !ctx) return;

    const rootRect = certificateRef.current.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const scaleX = canvas.width / rootRect.width;
    const scaleY = canvas.height / rootRect.height;
    const x = (anchorRect.left - rootRect.left) * scaleX;
    const y = (anchorRect.top - rootRect.top) * scaleY;
    const width = anchorRect.width * scaleX;
    const height = anchorRect.height * scaleY;

    const qr = new Image();
    qr.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      qr.onload = () => resolve();
      qr.onerror = () => reject(new Error('QR image failed to load'));
      qr.src = qrDataUrl;
    });

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, width, height);
    ctx.drawImage(qr, x, y, width, height);
  };

  const renderCertificateCanvas = async (): Promise<{ canvas: HTMLCanvasElement; certId: string }> => {
    if (!certificateRef.current) throw new Error('Certificate not mounted');
    await ensureLogoDataUrl();
    const certId = await getOrCreateCertificate();
    const qrDataUrl = await generateQrDataUrl(certId);
    // Let React flush qrImageUrl into the DOM, then wait two animation frames
    // so the <img> has time to mount before html2canvas snapshots.
    await new Promise((r) => setTimeout(r, 60));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await waitForCertificateImages(certificateRef.current);
    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#08111F',
    });
    await drawQrOntoCanvas(canvas, qrDataUrl);
    return { canvas, certId };
  };

  const savePdfFromCanvas = (canvas: HTMLCanvasElement) => {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${studentName.replace(/\s+/g, '_')}_${quizTitle.replace(/\s+/g, '_')}_Certificate.pdf`);
  };

  const handleDownload = async () => {
    if (!certificateRef.current || percentage < 70) return;
    setIsGenerating(true);
    try {
      const { canvas } = await renderCertificateCanvas();
      toast.success('Certificate ready — downloading PDF');
      savePdfFromCanvas(canvas);
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Could not generate certificate QR. Please refresh and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Modern Obsidian Credential palette — premium digital-first certificate.
  const canvasBg = '#08111F';
  const panel = '#0D1728';
  const panelSoft = '#111D31';
  const ink = '#F8FBFF';
  const inkSoft = '#C9D5E8';
  const muted = '#7E8EA8';
  const line = 'rgba(190, 211, 255, 0.22)';
  const cyan = '#22D3EE';
  const violet = '#8B5CF6';
  const emerald = '#34D399';
  const amber = '#F4C76A';

  const issueNo = (submissionId || '').replace(/-/g, '').slice(0, 8).toUpperCase() || '————————';
  const yearMark = format(date, 'yyyy');
  const standing =
    percentage >= 90 ? 'Distinction' :
    percentage >= 80 ? 'First Class' :
    'Pass with Merit';
  const verifyShortId = (certificateId || submissionId || '').slice(0, 8).toUpperCase();
  const romanYear = (() => {
    const n = date.getFullYear();
    const map: [number, string][] = [
      [1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],
      [50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I'],
    ];
    let v = n, out = '';
    for (const [num, sym] of map) { while (v >= num) { out += sym; v -= num; } }
    return out;
  })();

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button onClick={handleDownload} disabled={isGenerating} className="gap-2 w-full sm:w-auto">
          {isGenerating ? <Award className="h-4 w-4 animate-pulse" /> : <Download className="h-4 w-4" />}
          {isGenerating ? 'Generating...' : 'Download Certificate'}
        </Button>
      </div>

      {/* Off-screen Certificate DOM — kept rendered so export assets are ready */}
      <div
        ref={certificateRef}
        style={{
          display: 'flex',
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1056px',
          height: '816px',
          backgroundColor: canvasBg,
          boxSizing: 'border-box',
          flexDirection: 'column',
          fontFamily: "'Manrope', 'Inter', 'Helvetica Neue', Arial, sans-serif",
          color: ink,
          zIndex: -1,
          overflow: 'hidden',
          pointerEvents: 'none',
          padding: '0',
        }}
      >
        {/* Ambient certificate surface */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 18% 12%, rgba(34, 211, 238, 0.24), transparent 30%), radial-gradient(circle at 82% 18%, rgba(139, 92, 246, 0.28), transparent 34%), linear-gradient(135deg, ${canvasBg}, #0B1020 48%, #071322)` }} />
        <div style={{ position: 'absolute', inset: '34px', border: `1px solid ${line}`, borderRadius: '28px', background: 'rgba(13, 23, 40, 0.72)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', left: '58px', right: '58px', top: '88px', height: '1px', background: `linear-gradient(90deg, transparent, ${cyan}, ${violet}, transparent)` }} />
        <div style={{ position: 'absolute', left: '58px', right: '58px', bottom: '88px', height: '1px', background: `linear-gradient(90deg, transparent, ${violet}, ${cyan}, transparent)` }} />

        {/* === MAIN CONTENT === */}
        <div style={{
          position: 'absolute', top: '58px', left: '58px',
          right: '330px', bottom: '58px',
          padding: '36px 42px 36px',
          display: 'flex', flexDirection: 'column',
          zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              height: '62px', width: '62px',
              borderRadius: '18px',
              border: `1px solid ${line}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))',
            }}>
              <img
                src={logoDataUrl || universityLogo}
                alt="Sharnbasva University"
                style={{ height: '42px', width: '42px', objectFit: 'contain' }}
              />
            </div>
            <div style={{ lineHeight: 1.15 }}>
              <p style={{
                margin: 0,
                  fontFamily: "'Sora', 'Manrope', sans-serif",
                  fontWeight: 800, fontSize: '20px',
                color: ink, letterSpacing: '0',
              }}>
                Sharnbasva University
              </p>
              <p style={{
                margin: '4px 0 0',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '8px', letterSpacing: '0.22em',
                textTransform: 'uppercase', color: muted, fontWeight: 600,
              }}>
                Department of Computer Science &amp; Design · Kalaburagi
              </p>
            </div>
            </div>
            <div style={{
              border: `1px solid rgba(52, 211, 153, 0.35)`,
              color: emerald,
              borderRadius: '999px',
              padding: '8px 12px',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 800,
              background: 'rgba(52, 211, 153, 0.09)',
            }}>
              Verified Credential
            </div>
          </div>

          <div style={{ marginTop: '54px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ height: '1px', width: '58px', background: `linear-gradient(90deg, ${cyan}, ${violet})` }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '10px', letterSpacing: '0.36em',
              textTransform: 'uppercase', color: cyan, fontWeight: 800,
            }}>
              Certificate of Achievement
            </span>
          </div>

          <h1 style={{
            margin: '16px 0 0',
            fontFamily: "'Sora', 'Manrope', sans-serif",
            fontWeight: 800,
            fontSize: '56px', lineHeight: 1.03,
            color: ink, letterSpacing: '0',
          }}>
            Modern Academic Excellence
          </h1>
          <p style={{
            margin: '14px 0 0',
            maxWidth: '620px',
            color: inkSoft,
            fontSize: '15px',
            lineHeight: 1.7,
          }}>
            This digital credential certifies that the recipient has successfully completed the assessment with verified performance and institutional recognition.
          </p>

          <div style={{ marginTop: '36px' }}>
            <p style={{
              margin: '0 0 10px',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '9px', letterSpacing: '0.28em',
              textTransform: 'uppercase', color: muted, fontWeight: 800,
            }}>
              Awarded to
            </p>
            <h2 style={{
              margin: 0,
              fontFamily: "'Sora', 'Manrope', sans-serif",
              fontWeight: 800, fontSize: '52px', lineHeight: 1.08,
              color: ink, letterSpacing: '0',
              paddingBottom: '18px',
              borderBottom: `1px solid ${line}`,
            }}>
              {studentName}
            </h2>
            {studentUsn && (
              <p style={{
                margin: '12px 0 0',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '10px', letterSpacing: '0.24em',
                color: muted, textTransform: 'uppercase', fontWeight: 700,
              }}>
                University Seat No. <span style={{ color: cyan, fontWeight: 800 }}>{studentUsn}</span>
              </p>
            )}
          </div>

          <p style={{
            margin: '24px 0 0',
            fontSize: '14px', lineHeight: 1.75,
            color: inkSoft, maxWidth: '610px',
          }}>
            Completed the academic assessment titled
            <span style={{
              display: 'inline',
              fontFamily: "'Sora', sans-serif",
              fontWeight: 800,
              color: amber, fontSize: '14px',
            }}> “{quizTitle}” </span>
            and is recognised by the Department of Computer Science &amp; Design.
          </p>

          <div style={{
            marginTop: 'auto',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: '14px',
          }}>
            {[
              { label: 'Score', value: `${score}`, suffix: ` / ${totalMarks}`, color: ink },
              { label: 'Percentage', value: `${percentage}`, suffix: '%', color: cyan },
              { label: 'Standing', value: standing, suffix: '', color: emerald },
            ].map((cell, i) => (
              <div key={cell.label} style={{
                border: `1px solid ${line}`,
                borderRadius: '18px',
                padding: '18px',
                background: i === 1 ? 'rgba(34, 211, 238, 0.08)' : 'rgba(255,255,255,0.045)',
              }}>
                <p style={{
                  margin: 0,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '8px', letterSpacing: '0.28em',
                  textTransform: 'uppercase', color: muted, fontWeight: 700,
                }}>{cell.label}</p>
                <p style={{
                  margin: '10px 0 0',
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  fontSize: i === 2 ? '22px' : '34px',
                  lineHeight: 1, letterSpacing: '0',
                  color: cell.color,
                }}>
                  {cell.value}
                  {cell.suffix && (
                    <span style={{
                      color: muted, fontSize: '16px',
                      fontWeight: 700,
                    }}>{cell.suffix}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* === RIGHT VERIFICATION PANEL === */}
        <div style={{
          position: 'absolute', top: '58px', right: '58px', bottom: '58px',
          width: '270px',
          padding: '34px 28px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          borderRadius: '24px',
          border: `1px solid ${line}`,
          background: `linear-gradient(180deg, ${panelSoft}, ${panel})`,
          zIndex: 3,
        }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <p style={{
              margin: 0,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '8px', letterSpacing: '0.32em',
              textTransform: 'uppercase', color: muted, fontWeight: 800,
            }}>
              Credential Seal · {romanYear}
            </p>
            <div style={{
              margin: '18px auto 0',
              width: '132px', height: '132px',
              borderRadius: '50%',
              border: `1px solid rgba(34, 211, 238, 0.55)`,
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(circle, rgba(34, 211, 238, 0.18), rgba(139, 92, 246, 0.10) 52%, rgba(255,255,255,0.04))',
            }}>
              <div style={{
                position: 'absolute', inset: '10px',
                borderRadius: '50%',
                border: `1px dashed rgba(255,255,255,0.28)`,
              }} />
              <div style={{ textAlign: 'center', lineHeight: 1 }}>
                <p style={{
                  margin: 0,
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 900,
                  fontSize: '34px', color: ink, letterSpacing: '0',
                }}>
                  CSD
                </p>
                <p style={{
                  margin: '6px 0 0',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '7px', letterSpacing: '0.3em',
                  textTransform: 'uppercase', color: cyan, fontWeight: 800,
                }}>
                  Seal · {yearMark}
                </p>
              </div>
            </div>
            <p style={{
              margin: '18px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '8px', letterSpacing: '0.28em',
              textTransform: 'uppercase', color: muted, fontWeight: 800,
            }}>
              № {issueNo}
            </p>
          </div>

          <div style={{ width: '100%', textAlign: 'center' }}>
            <p style={{
              margin: 0,
              fontFamily: "'Sora', sans-serif",
              fontWeight: 800,
              fontSize: '22px', color: ink, lineHeight: 1,
            }}>
              CSD Portal
            </p>
            <div style={{
              margin: '8px auto 0',
              height: '1px', width: '152px', background: `linear-gradient(90deg, transparent, ${cyan}, transparent)`,
            }} />
            <p style={{
              margin: '8px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '8px', letterSpacing: '0.26em',
              textTransform: 'uppercase', color: muted, fontWeight: 700,
            }}>
              Authorised Signatory
            </p>
            <p style={{
              margin: '14px 0 0',
              fontFamily: "'Sora', sans-serif",
              fontWeight: 700,
              fontSize: '13px', color: ink,
            }}>
              {format(date, 'd MMMM yyyy')}
            </p>
            <p style={{
              margin: '4px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '7.5px', letterSpacing: '0.28em',
              textTransform: 'uppercase', color: muted, fontWeight: 700,
            }}>
              Date of Issue
            </p>
          </div>

          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px',
              border: `1px solid rgba(255,255,255,0.28)`,
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              boxShadow: '0 18px 44px rgba(0,0,0,0.32)',
            }}>
              <img
                ref={qrImageRef}
                data-qr-anchor
                src={qrImageUrl || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2290%22 height=%2290%22><rect width=%2290%22 height=%2290%22 fill=%22%23FAF7F2%22/></svg>'}
                alt="Verification QR"
                crossOrigin="anonymous"
                style={{ width: '126px', height: '126px', display: 'block', backgroundColor: '#FFFFFF', borderRadius: '8px' }}
              />
            </div>
            <p style={{
              margin: '12px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '7.5px', letterSpacing: '0.3em',
              textTransform: 'uppercase', color: cyan, fontWeight: 800,
            }}>
              Scan to Verify
            </p>
            <p style={{
              margin: '4px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '9px', letterSpacing: '0.12em',
              color: inkSoft, fontWeight: 800,
            }}>
              ID · {verifyShortId}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
