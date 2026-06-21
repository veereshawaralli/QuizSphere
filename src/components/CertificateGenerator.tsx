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
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

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

  const buildVerificationUrl = useCallback(
    (id: string) => `${window.location.origin}/verify/${id}`,
    []
  );

  const drawQrOnCanvas = useCallback(
    async (canvas: HTMLCanvasElement, id: string, size = 156) => {
      canvas.width = size;
      canvas.height = size;
      canvas.style.width = '78px';
      canvas.style.height = '78px';
      const qr = (QRCode as unknown as {
        create: (text: string, options?: Record<string, unknown>) => {
          modules: { size: number; data: boolean[] };
        };
      }).create(buildVerificationUrl(id), { errorCorrectionLevel: 'H' });
      const quietZone = 1;
      const moduleCount = qr.modules.size + quietZone * 2;
      const moduleSize = size / moduleCount;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable.');
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#FAF7F2';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#0F1116';

      for (let row = 0; row < qr.modules.size; row += 1) {
        for (let col = 0; col < qr.modules.size; col += 1) {
          if (!qr.modules.data[row * qr.modules.size + col]) continue;
          const x = Math.round((col + quietZone) * moduleSize);
          const y = Math.round((row + quietZone) * moduleSize);
          const nextX = Math.round((col + quietZone + 1) * moduleSize);
          const nextY = Math.round((row + quietZone + 1) * moduleSize);
          ctx.fillRect(x, y, Math.max(1, nextX - x), Math.max(1, nextY - y));
        }
      }
    },
    [buildVerificationUrl]
  );

  const paintQrCanvasElement = useCallback(
    async (id: string, size = 156) => {
      if (!qrCanvasRef.current) return;
      await drawQrOnCanvas(qrCanvasRef.current, id, size);
    },
    [drawQrOnCanvas]
  );

  // Generate a QR PNG data URL so html2canvas always captures it reliably
  // (canvas capture can silently fail; <img src=data:...> never does).
  const generateQrDataUrl = useCallback(
    async (id: string) => {
      const url = await QRCode.toDataURL(buildVerificationUrl(id), {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 312,
        color: { dark: '#0F1116', light: '#FAF7F2' },
      });
      setQrImageUrl(url);
      return url;
    },
    [buildVerificationUrl],
  );

  // Pre-generate the verification QR so it's embedded on first render/download.
  useEffect(() => {
    const idForQr = certificateId || submissionId;
    if (!idForQr) return;
    paintQrCanvasElement(idForQr).catch(console.error);
    generateQrDataUrl(idForQr).catch(console.error);
  }, [certificateId, submissionId, paintQrCanvasElement, generateQrDataUrl]);

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

  const getQrRegionInCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const root = certificateRef.current;
    const qrContainer = root?.querySelector<HTMLElement>('[data-qr-anchor]');
      const qrTarget = qrContainer?.querySelector<HTMLElement>('[data-qr-target]') ?? qrContainer;

    if (!root || !qrContainer || !qrTarget) {
      throw new Error('QR element not found in DOM.');
    }

    const rootRect = root.getBoundingClientRect();
    const qrRect = qrTarget.getBoundingClientRect();
    const scaleX = canvas.width / rootRect.width;
    const scaleY = canvas.height / rootRect.height;

    return {
      sx: Math.max(0, Math.floor((qrRect.left - rootRect.left) * scaleX)),
      sy: Math.max(0, Math.floor((qrRect.top - rootRect.top) * scaleY)),
      sw: Math.max(1, Math.floor(Math.min(qrRect.width, qrRect.height) * scaleX)),
      sh: Math.max(1, Math.floor(Math.min(qrRect.width, qrRect.height) * scaleY)),
    };
  }, []);

  const paintQrPattern = useCallback((ctx: CanvasRenderingContext2D, certId: string, sx: number, sy: number, sw: number, sh: number) => {
    const qr = (QRCode as unknown as {
      create: (text: string, options?: Record<string, unknown>) => {
        modules: { size: number; data: ArrayLike<number | boolean> };
      };
    }).create(buildVerificationUrl(certId), { errorCorrectionLevel: 'H' });
    const quietZone = 1;
    const moduleCount = qr.modules.size + quietZone * 2;
    const moduleSize = Math.min(sw, sh) / moduleCount;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = '#0F1116';
    for (let row = 0; row < qr.modules.size; row += 1) {
      for (let col = 0; col < qr.modules.size; col += 1) {
        if (!qr.modules.data[row * qr.modules.size + col]) continue;
        const x = sx + Math.round((col + quietZone) * moduleSize);
        const y = sy + Math.round((row + quietZone) * moduleSize);
        const nextX = sx + Math.round((col + quietZone + 1) * moduleSize);
        const nextY = sy + Math.round((row + quietZone + 1) * moduleSize);
        ctx.fillRect(x, y, Math.max(1, nextX - x), Math.max(1, nextY - y));
      }
    }
    ctx.restore();
  }, [buildVerificationUrl]);

  const paintQrOntoCanvas = useCallback(
    async (canvas: HTMLCanvasElement, certId: string) => {
      const { sx, sy, sw, sh } = getQrRegionInCanvas(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable.');
      paintQrPattern(ctx, certId, sx, sy, sw, sh);
    },
    [getQrRegionInCanvas, paintQrPattern]
  );

  /**
   * Render the off-screen certificate to a canvas, ensuring the verification QR
   * is committed to the DOM and fully decoded before the snapshot is taken.
   */
  const renderCertificateCanvas = async (): Promise<{ canvas: HTMLCanvasElement; certId: string }> => {
    if (!certificateRef.current) throw new Error('Certificate not mounted');
    await ensureLogoDataUrl();
    const certId = await getOrCreateCertificate();
    await paintQrCanvasElement(certId);
    await generateQrDataUrl(certId);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await waitForCertificateImages(certificateRef.current);
    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    await paintQrOntoCanvas(canvas, certId);
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
      toast.error('Could not generate certificate. See console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Editorial palette — museum-grade, print-safe, calm with two confident accents.
  const paper      = '#FAF7F2';   // warm ivory
  const paperDeep  = '#F1ECE2';   // tonal band
  const ink        = '#0F1116';   // near-black
  const inkSoft    = '#3A3D47';
  const muted      = '#8A8A95';
  const hairline   = '#D8D2C5';   // warm rule
  const gold       = '#A07A2C';   // antique gold
  const goldSoft   = '#C8A85B';
  const accent     = '#B91C3C';   // editorial crimson (single bold accent)

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
        <Button onClick={handleDownload} disabled={isGenerating || isTesting} className="gap-2 w-full sm:w-auto">
          {isGenerating ? <Award className="h-4 w-4 animate-pulse" /> : <Download className="h-4 w-4" />}
          {isGenerating ? 'Generating...' : 'Download Certificate'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleTestExport}
          disabled={isGenerating || isTesting}
          className="gap-2 w-full sm:w-auto"
        >
          {isTesting ? <Award className="h-4 w-4 animate-pulse" /> : <ShieldCheck className="h-4 w-4" />}
          {isTesting ? 'Testing...' : 'Test Certificate Export'}
        </Button>
      </div>

      {testResult && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Certificate export preview"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={closeTestPreview}
        >
          <div
            className="bg-background text-foreground rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-5 border-b">
              <div className="flex items-start gap-3">
                {testResult.qrPassed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {testResult.qrPassed ? 'QR verified — preview looks good' : 'QR check failed'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{testResult.detail}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={closeTestPreview} aria-label="Close preview">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-5 grid gap-5 md:grid-cols-[1fr_220px]">
              <div className="border rounded-lg overflow-hidden bg-muted/30">
                <img
                  src={testResult.previewUrl}
                  alt="Certificate preview"
                  className="w-full h-auto block"
                />
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  QR region snapshot
                </p>
                {testResult.qrCropUrl ? (
                  <div className="border rounded-lg p-2 bg-white inline-block">
                    <img
                      src={testResult.qrCropUrl}
                      alt="Cropped QR from rendered certificate"
                      className="w-[180px] h-[180px] object-contain"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No QR region captured.</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Pixels above were sampled directly from the PDF source canvas. If the QR
                  looks correct here, it will be correct in the downloaded file.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end p-5 border-t">
              <Button variant="outline" onClick={closeTestPreview}>Close</Button>
              <Button onClick={handleConfirmDownloadFromTest} className="gap-2" disabled={!testResult.qrPassed}>
                <Download className="h-4 w-4" />
                {testResult.qrPassed ? 'Looks good — Download PDF' : 'QR missing — cannot download'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
          backgroundColor: paper,
          boxSizing: 'border-box',
          flexDirection: 'column',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          color: ink,
          zIndex: -1,
          overflow: 'hidden',
          pointerEvents: 'none',
          padding: '0',
        }}
      >
        {/* Outer ivory canvas with double-rule frame */}
        <div style={{
          position: 'absolute', inset: '24px',
          border: `1.5px solid ${ink}`,
          backgroundColor: paper,
        }} />
        <div style={{
          position: 'absolute', inset: '32px',
          border: `1px solid ${hairline}`,
          pointerEvents: 'none',
        }} />

        {/* Tonal vertical band on the right (asymmetric editorial layout) */}
        <div style={{
          position: 'absolute', top: '32px', right: '32px', bottom: '32px',
          width: '232px',
          backgroundColor: paperDeep,
          borderLeft: `1px solid ${hairline}`,
        }} />

        {/* Corner ornaments — small gold L-marks */}
        {[
          { top: '40px', left: '40px',   borders: { borderTop: `2px solid ${gold}`, borderLeft: `2px solid ${gold}` } },
          { top: '40px', right: '40px',  borders: { borderTop: `2px solid ${gold}`, borderRight: `2px solid ${gold}` } },
          { bottom: '40px', left: '40px', borders: { borderBottom: `2px solid ${gold}`, borderLeft: `2px solid ${gold}` } },
          { bottom: '40px', right: '40px', borders: { borderBottom: `2px solid ${gold}`, borderRight: `2px solid ${gold}` } },
        ].map((c, i) => (
          <div key={i} style={{ position: 'absolute', width: '18px', height: '18px', ...c.borders, ...c, zIndex: 4 } as React.CSSProperties} />
        ))}

        {/* === MAIN CONTENT (left column) === */}
        <div style={{
          position: 'absolute', top: '32px', left: '32px',
          right: '264px', bottom: '32px',
          padding: '46px 56px 40px',
          display: 'flex', flexDirection: 'column',
          zIndex: 2,
        }}>
          {/* Crest + masthead */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              height: '54px', width: '54px',
              border: `1.5px solid ${ink}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: paper,
            }}>
              <img
                src={logoDataUrl || universityLogo}
                alt="Sharnbasva University"
                style={{ height: '38px', width: '38px', objectFit: 'contain' }}
              />
            </div>
            <div style={{ lineHeight: 1.15 }}>
              <p style={{
                margin: 0,
                fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
                fontWeight: 700, fontSize: '20px',
                color: ink, letterSpacing: '-0.005em',
              }}>
                Sharnbasva University
              </p>
              <p style={{
                margin: '4px 0 0',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '8.5px', letterSpacing: '0.32em',
                textTransform: 'uppercase', color: muted, fontWeight: 600,
              }}>
                Department of Computer Science &amp; Design · Kalaburagi
              </p>
            </div>
          </div>

          {/* Eyebrow rule */}
          <div style={{ marginTop: '36px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ height: '1px', width: '44px', background: gold }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '10px', letterSpacing: '0.42em',
              textTransform: 'uppercase', color: gold, fontWeight: 700,
            }}>
              Certificate of Achievement
            </span>
          </div>

          {/* Editorial display headline */}
          <h1 style={{
            margin: '14px 0 0',
            fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
            fontWeight: 400, fontStyle: 'italic',
            fontSize: '46px', lineHeight: 1.05,
            color: ink, letterSpacing: '-0.015em',
          }}>
            This is to certify that
          </h1>

          {/* Recipient — large serif, single hairline rule beneath */}
          <div style={{ marginTop: '20px' }}>
            <h2 style={{
              margin: 0,
              fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
              fontWeight: 700, fontSize: '54px', lineHeight: 1.05,
              color: ink, letterSpacing: '-0.02em',
              paddingBottom: '14px',
              borderBottom: `1px solid ${ink}`,
            }}>
              {studentName}
            </h2>
            {studentUsn && (
              <p style={{
                margin: '12px 0 0',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '10px', letterSpacing: '0.28em',
                color: muted, textTransform: 'uppercase', fontWeight: 600,
              }}>
                University Seat № <span style={{ color: ink, fontWeight: 700 }}>{studentUsn}</span>
              </p>
            )}
          </div>

          {/* Citation */}
          <p style={{
            margin: '22px 0 0',
            fontFamily: "'Inter', sans-serif",
            fontSize: '13.5px', lineHeight: 1.7,
            color: inkSoft, maxWidth: '560px',
          }}>
            has, with diligence and distinction, completed the academic assessment titled
            <span style={{
              display: 'inline',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic', fontWeight: 700,
              color: ink, fontSize: '15px',
            }}> “{quizTitle}” </span>
            and is hereby recognised by the Department of Computer Science &amp; Design.
          </p>

          {/* Score ledger — three columns, hairlines only */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '24px',
            borderTop: `1px solid ${hairline}`,
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            columnGap: '0',
          }}>
            {[
              { label: 'Score',      value: `${score}`, suffix: ` / ${totalMarks}`, color: ink },
              { label: 'Percentage', value: `${percentage}`, suffix: '%',             color: accent },
              { label: 'Standing',   value: standing, suffix: '',                     color: ink, serif: true },
            ].map((cell, i) => (
              <div key={cell.label} style={{
                paddingLeft: i === 0 ? 0 : '24px',
                paddingRight: i === 2 ? 0 : '24px',
                borderRight: i < 2 ? `1px solid ${hairline}` : 'none',
              }}>
                <p style={{
                  margin: 0,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '9px', letterSpacing: '0.34em',
                  textTransform: 'uppercase', color: muted, fontWeight: 700,
                }}>{cell.label}</p>
                <p style={{
                  margin: '10px 0 0',
                  fontFamily: cell.serif
                    ? "'Playfair Display', Georgia, serif"
                    : "'Playfair Display', Georgia, serif",
                  fontWeight: 700,
                  fontSize: cell.serif ? '24px' : '38px',
                  lineHeight: 1, letterSpacing: '-0.02em',
                  color: cell.color,
                }}>
                  {cell.value}
                  {cell.suffix && (
                    <span style={{
                      color: muted, fontSize: cell.serif ? '14px' : '20px',
                      fontWeight: 500, fontStyle: 'italic',
                    }}>{cell.suffix}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* === RIGHT COLUMN (tonal band) === */}
        <div style={{
          position: 'absolute', top: '32px', right: '32px', bottom: '32px',
          width: '232px',
          padding: '46px 28px 40px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          zIndex: 3,
        }}>
          {/* Top: monogram seal */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <p style={{
              margin: 0,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '8.5px', letterSpacing: '0.4em',
              textTransform: 'uppercase', color: muted, fontWeight: 700,
            }}>
              Anno · {romanYear}
            </p>
            <div style={{
              margin: '18px auto 0',
              width: '128px', height: '128px',
              borderRadius: '50%',
              border: `1.5px solid ${gold}`,
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: paper,
            }}>
              <div style={{
                position: 'absolute', inset: '8px',
                borderRadius: '50%',
                border: `1px solid ${goldSoft}`,
              }} />
              <div style={{ textAlign: 'center', lineHeight: 1 }}>
                <p style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: 'italic', fontWeight: 700,
                  fontSize: '40px', color: gold, letterSpacing: '-0.04em',
                }}>
                  CSD
                </p>
                <p style={{
                  margin: '6px 0 0',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '7px', letterSpacing: '0.36em',
                  textTransform: 'uppercase', color: gold, fontWeight: 700,
                }}>
                  Seal · {yearMark}
                </p>
              </div>
            </div>
            <p style={{
              margin: '18px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '8px', letterSpacing: '0.34em',
              textTransform: 'uppercase', color: muted, fontWeight: 700,
            }}>
              № {issueNo}
            </p>
          </div>

          {/* Middle: signature */}
          <div style={{ width: '100%', textAlign: 'center' }}>
            <p style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic', fontWeight: 700,
              fontSize: '26px', color: ink, lineHeight: 1,
            }}>
              CSD Portal
            </p>
            <div style={{
              margin: '8px auto 0',
              height: '1px', width: '140px', background: ink,
            }} />
            <p style={{
              margin: '8px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '8px', letterSpacing: '0.3em',
              textTransform: 'uppercase', color: muted, fontWeight: 700,
            }}>
              Authorised Signatory
            </p>
            <p style={{
              margin: '14px 0 0',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic', fontWeight: 600,
              fontSize: '13px', color: ink,
            }}>
              {format(date, 'd MMMM yyyy')}
            </p>
            <p style={{
              margin: '4px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '7.5px', letterSpacing: '0.34em',
              textTransform: 'uppercase', color: muted, fontWeight: 700,
            }}>
              Date of Issue
            </p>
          </div>

          {/* Bottom: QR + verify */}
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div data-qr-anchor style={{
              display: 'inline-block',
              padding: '6px',
              border: `1px solid ${ink}`,
              backgroundColor: paper,
            }}>
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  data-qr-target
                  alt="Verification QR"
                  crossOrigin="anonymous"
                  style={{ width: '78px', height: '78px', display: 'block', backgroundColor: paper }}
                />
              ) : (
                <canvas
                  ref={qrCanvasRef}
                  data-qr-target
                  aria-label="Verify QR"
                  style={{ width: '78px', height: '78px', display: 'block', backgroundColor: paper }}
                />
              )}
            </div>
            <p style={{
              margin: '10px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '7.5px', letterSpacing: '0.32em',
              textTransform: 'uppercase', color: muted, fontWeight: 700,
            }}>
              Scan to Verify
            </p>
            <p style={{
              margin: '4px 0 0',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: '9px', letterSpacing: '0.14em',
              color: ink, fontWeight: 700,
            }}>
              ID · {verifyShortId}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
