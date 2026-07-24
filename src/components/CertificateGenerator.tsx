import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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

  const qrMatrix = useMemo(() => {
    if (!certificateId) return null;
    const qr = QRCode.create(buildVerificationUrl(certificateId), { errorCorrectionLevel: 'H' });
    const moduleCount = qr.modules.size;
    const darkModules: Array<{ row: number; col: number }> = [];
    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {
        if (qr.modules.data[row * moduleCount + col]) darkModules.push({ row, col });
      }
    }
    return { moduleCount, darkModules, quietZone: 4 };
  }, [certificateId, buildVerificationUrl]);

  const createQrDataUrl = useCallback(async (id: string) => {
    return QRCode.toDataURL(buildVerificationUrl(id), {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512,
      color: { dark: '#07111F', light: '#FFFFFF' },
    });
  }, [buildVerificationUrl]);

  const drawQrModules = useCallback((ctx: CanvasRenderingContext2D, id: string, x: number, y: number, width: number, height: number) => {
    const qr = QRCode.create(buildVerificationUrl(id), { errorCorrectionLevel: 'H' });
    const modules = qr.modules;
    const moduleCount = modules.size;
    const quietZone = 4;
    const cellSize = Math.floor(Math.min(width, height) / (moduleCount + quietZone * 2));
    if (cellSize < 1) throw new Error('QR export area is too small');

    const qrSize = cellSize * (moduleCount + quietZone * 2);
    const offsetX = Math.round(x + (width - qrSize) / 2);
    const offsetY = Math.round(y + (height - qrSize) / 2);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#07111F';
    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {
        if (modules.data[row * moduleCount + col]) {
          ctx.fillRect(
            offsetX + (col + quietZone) * cellSize,
            offsetY + (row + quietZone) * cellSize,
            cellSize,
            cellSize,
          );
        }
      }
    }
  }, [buildVerificationUrl]);

  // Generate a QR PNG data URL and also paint the exact same QR into a canvas.
  // The canvas makes the on-certificate QR visible; the data URL is retained as
  // a fallback source for final PDF painting.
  const generateQrDataUrl = useCallback(
    async (id: string) => {
      const url = await createQrDataUrl(id);
      setQrImageUrl(url);
      return url;
    },
    [createQrDataUrl],
  );

  const getOrCreateCertificate = useCallback(async (): Promise<string> => {
    if (certificateId) return certificateId;
    if (!submissionId || !quizId || !studentId) {
      throw new Error('Certificate details are incomplete');
    }

    const { data, error } = await supabase.functions.invoke('ensure-certificate', {
      body: {
        submissionId,
        quizId,
        studentName,
        quizTitle,
      },
    });

    const id = (data as { certificateId?: string } | null)?.certificateId;
    if (error || !id) throw error || new Error('Failed to create certificate');
    setCertificateId(id);
    return id;
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
  const paintQrImageOntoExport = async (canvas: HTMLCanvasElement, qrDataUrl: string, certId: string) => {
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

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, width, height);
    ctx.imageSmoothingEnabled = false;
    drawQrModules(ctx, certId, x, y, width, height);

    const sample = ctx.getImageData(Math.round(x), Math.round(y), Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height))).data;
    let darkPixels = 0;
    for (let i = 0; i < sample.length; i += 4) {
      if ((sample[i] + sample[i + 1] + sample[i + 2]) / 3 < 90) darkPixels += 1;
    }

    if (darkPixels < 1000) throw new Error('QR export verification failed');
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
    await paintQrImageOntoExport(canvas, qrDataUrl, certId);
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

  // Modern "Aurora Credential" palette — clean, premium, digital-first.
  const canvasBg = '#0A1220';
  const ink = '#F5F9FF';
  const inkSoft = '#CBD5E8';
  const muted = '#8493AE';
  const line = 'rgba(190, 211, 255, 0.22)';
  const cyan = '#22D3EE';
  const violet = '#A78BFA';
  const emerald = '#34D399';
  const amber = '#F4C76A';

  const issueNo = (submissionId || '').replace(/-/g, '').slice(0, 10).toUpperCase() || '——————————';
  const standing =
    percentage >= 90 ? 'Distinction' :
    percentage >= 80 ? 'First Class' :
    'Pass with Merit';
  const verifyShortId = (certificateId || submissionId || '').slice(0, 8).toUpperCase();

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
          width: '1123px',
          height: '794px',
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
        {/* Ambient background */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(1000px 500px at 12% -10%, rgba(34, 211, 238, 0.28), transparent 55%), radial-gradient(900px 500px at 105% 0%, rgba(167, 139, 250, 0.32), transparent 55%), radial-gradient(700px 400px at 50% 115%, rgba(52, 211, 153, 0.18), transparent 60%), linear-gradient(135deg, ${canvasBg}, #0B1424 55%, #06101E)` }} />

        {/* Inner frame */}
        <div style={{ position: 'absolute', inset: '28px', border: `1px solid ${line}`, borderRadius: '24px', background: 'rgba(11, 20, 36, 0.72)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)' }} />

        {/* Corner marks */}
        {[
          { top: 40, left: 40 },
          { top: 40, right: 40 },
          { bottom: 40, left: 40 },
          { bottom: 40, right: 40 },
        ].map((pos, i) => (
          <div key={i} style={{ position: 'absolute', ...pos, width: '46px', height: '46px', borderTop: pos.top !== undefined ? `2px solid ${cyan}` : 'none', borderBottom: pos.bottom !== undefined ? `2px solid ${violet}` : 'none', borderLeft: pos.left !== undefined ? `2px solid ${cyan}` : 'none', borderRight: pos.right !== undefined ? `2px solid ${violet}` : 'none', borderTopLeftRadius: pos.top !== undefined && pos.left !== undefined ? 14 : 0, borderTopRightRadius: pos.top !== undefined && pos.right !== undefined ? 14 : 0, borderBottomLeftRadius: pos.bottom !== undefined && pos.left !== undefined ? 14 : 0, borderBottomRightRadius: pos.bottom !== undefined && pos.right !== undefined ? 14 : 0, opacity: 0.85 }} />
        ))}

        {/* === HEADER: Logo + University === */}
        <div style={{
          position: 'absolute', top: '70px', left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2,
        }}>
          <div style={{
            height: '96px', width: '96px', borderRadius: '50%',
            border: `1.5px solid ${line}`,
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.16), rgba(167, 139, 250, 0.10) 55%, rgba(255,255,255,0.04))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(34, 211, 238, 0.15)',
          }}>
            <img
              src={logoDataUrl || universityLogo}
              alt="Sharnbasva University"
              style={{ height: '72px', width: '72px', objectFit: 'contain' }}
            />
          </div>
          <h1 style={{
            margin: '18px 0 0',
            fontFamily: "'Sora', 'Manrope', sans-serif",
            fontWeight: 800, fontSize: '30px', lineHeight: 1,
            color: ink, letterSpacing: '0.01em',
            textAlign: 'center',
          }}>
            Sharnbasva University
          </h1>
          <p style={{
            margin: '8px 0 0',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '10px', letterSpacing: '0.32em',
            textTransform: 'uppercase', color: muted, fontWeight: 700,
          }}>
            Department of Computer Science &amp; Design · Kalaburagi
          </p>
          <div style={{ marginTop: '22px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ height: '1px', width: '80px', background: `linear-gradient(90deg, transparent, ${cyan})` }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '11px', letterSpacing: '0.4em',
              textTransform: 'uppercase', color: cyan, fontWeight: 800,
            }}>
              Certificate of Achievement
            </span>
            <span style={{ height: '1px', width: '80px', background: `linear-gradient(90deg, ${violet}, transparent)` }} />
          </div>
        </div>

        {/* === STUDENT NAME === */}
        <div style={{
          position: 'absolute', top: '310px', left: '80px', right: '80px',
          textAlign: 'center', zIndex: 2,
        }}>
          <p style={{
            margin: 0,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '10px', letterSpacing: '0.36em',
            textTransform: 'uppercase', color: muted, fontWeight: 700,
          }}>
            This certificate is proudly presented to
          </p>
          <h2 style={{
            margin: '18px 0 0',
            fontFamily: "'Sora', 'Manrope', sans-serif",
            fontWeight: 800, fontSize: '54px', lineHeight: 1.05,
            color: ink, letterSpacing: '0',
          }}>
            {studentName}
          </h2>
          <div style={{
            margin: '18px auto 0',
            height: '1px', width: '360px',
            background: `linear-gradient(90deg, transparent, ${cyan}, ${violet}, transparent)`,
          }} />
          {studentUsn && (
            <p style={{
              margin: '14px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '11px', letterSpacing: '0.28em',
              color: muted, textTransform: 'uppercase', fontWeight: 700,
            }}>
              University Seat No. <span style={{ color: cyan, fontWeight: 800 }}>{studentUsn}</span>
            </p>
          )}
          <p style={{
            margin: '22px auto 0',
            fontSize: '14px', lineHeight: 1.75,
            color: inkSoft, maxWidth: '760px',
          }}>
            for successfully completing the academic assessment
            <span style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 800, color: amber, fontSize: '15px',
            }}> “{quizTitle}” </span>
            with verified performance and institutional recognition.
          </p>
        </div>

        {/* === RESULT + VERIFICATION BLOCKS === */}
        <div style={{
          position: 'absolute', left: '90px', right: '90px', bottom: '170px',
          display: 'grid', gridTemplateColumns: '1.08fr 1fr 1fr 1.08fr', gap: '14px',
          zIndex: 2,
        }}>
          {[
            { label: 'Subject', value: quizTitle.length > 18 ? quizTitle.slice(0, 17) + '…' : quizTitle, size: '18px', color: ink, mono: false },
            { label: 'Score', value: `${score}/${totalMarks}`, size: '30px', color: ink, mono: false },
            { label: 'Percentage', value: `${percentage}%`, size: '30px', color: cyan, mono: false, glow: true },
            { label: 'USN', value: studentUsn || 'Verified', size: '16px', color: emerald, mono: true },
          ].map((c, i) => (
            <div key={c.label} style={{
              border: `1px solid ${line}`,
              borderRadius: '16px',
              padding: '16px 16px 18px',
              background: c.glow ? 'linear-gradient(180deg, rgba(34,211,238,0.14), rgba(34,211,238,0.04))' : 'rgba(255,255,255,0.04)',
              boxShadow: c.glow ? '0 8px 28px rgba(34,211,238,0.18)' : 'none',
              textAlign: 'center',
            }}>
              <p style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '8px', letterSpacing: '0.3em',
                textTransform: 'uppercase', color: muted, fontWeight: 800,
              }}>{c.label}</p>
              <p style={{
                margin: '12px 0 0',
                fontFamily: "'Sora', sans-serif",
                fontWeight: 800,
                fontSize: c.size, lineHeight: 1, color: c.color,
              }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* === FOOTER: issue details / signatory / QR === */}
        <div style={{
          position: 'absolute', left: '90px', right: '90px', bottom: '42px',
          display: 'grid', gridTemplateColumns: '1fr 1fr 178px', alignItems: 'end', gap: '26px',
          zIndex: 2,
        }}>
          <div style={{ textAlign: 'left', minWidth: '200px' }}>
            <p style={{
              margin: 0, fontFamily: "'Sora', sans-serif", fontWeight: 700,
              fontSize: '15px', color: ink,
            }}>{format(date, 'd MMMM yyyy')}</p>
            <div style={{ marginTop: '6px', height: '1px', width: '150px', background: line }} />
            <p style={{
              margin: '8px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '8px', letterSpacing: '0.28em',
              textTransform: 'uppercase', color: muted, fontWeight: 700,
            }}>Date of Issue</p>
            <p style={{
              margin: '10px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '9px', letterSpacing: '0.2em',
              color: muted, fontWeight: 700,
            }}>Credential №&nbsp;<span style={{ color: inkSoft }}>{issueNo}</span></p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{
              margin: 0, fontFamily: "'Sora', sans-serif", fontWeight: 700,
              fontSize: '15px', color: ink,
            }}>CSD Portal</p>
            <div style={{ margin: '6px auto 0', height: '1px', width: '160px', background: `linear-gradient(90deg, transparent, ${cyan}, transparent)` }} />
            <p style={{
              margin: '8px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '8px', letterSpacing: '0.28em',
              textTransform: 'uppercase', color: muted, fontWeight: 700,
            }}>Authorised Signatory</p>
            <p style={{
              margin: '10px 0 0',
              fontFamily: "'Sora', sans-serif",
              fontSize: '16px', lineHeight: 1, color: emerald, fontWeight: 800,
            }}>{standing}</p>
          </div>

          <div style={{ textAlign: 'center', justifySelf: 'end' }}>
            <div style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px',
              border: `1px solid rgba(255,255,255,0.30)`,
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 14px 40px rgba(0,0,0,0.32)',
            }}>
              <div
                data-qr-anchor
                aria-label="Verification QR"
                style={{
                  width: '126px',
                  height: '126px',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${(qrMatrix?.moduleCount ?? 45) + (qrMatrix?.quietZone ?? 4) * 2}, 1fr)`,
                  gridTemplateRows: `repeat(${(qrMatrix?.moduleCount ?? 45) + (qrMatrix?.quietZone ?? 4) * 2}, 1fr)`,
                  backgroundColor: '#FFFFFF',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                {qrMatrix?.darkModules.map((module) => (
                  <span
                    key={`${module.row}-${module.col}`}
                    style={{
                      gridColumnStart: module.col + qrMatrix.quietZone + 1,
                      gridRowStart: module.row + qrMatrix.quietZone + 1,
                      backgroundColor: '#07111F',
                    }}
                  />
                ))}
              </div>
            </div>
            <p style={{
              margin: '8px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '8px', letterSpacing: '0.32em',
              textTransform: 'uppercase', color: cyan, fontWeight: 800,
            }}>Scan to Verify Details</p>
            <p style={{
              margin: '4px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '9px', letterSpacing: '0.14em',
              color: inkSoft, fontWeight: 800,
            }}>ID · {verifyShortId}</p>
          </div>
        </div>
      </div>
    </>
  );
}
