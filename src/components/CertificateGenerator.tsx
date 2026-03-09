import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from './ui/button';
import { Download, Award } from 'lucide-react';
import { format } from 'date-fns';
import universityLogo from '../assets/university-logo.png';

interface CertificateProps {
  studentName: string;
  quizTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  date: Date;
}

export function CertificateGenerator({
  studentName,
  quizTitle,
  score,
  totalMarks,
  percentage,
  date,
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setIsGenerating(true);
    
    try {
      // Temporarily make the certificate visible for html2canvas
      certificateRef.current.style.display = 'flex';
      
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
      });
      
      certificateRef.current.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
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
          width: '1056px', // 11 inches at 96 DPI
          height: '816px', // 8.5 inches at 96 DPI
          backgroundColor: 'white',
          padding: '40px',
          boxSizing: 'border-box',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          border: '20px solid #1e3a8a', // Using a standard blue
          fontFamily: 'sans-serif',
          backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          zIndex: -1,
        }}
      >
        <div
          style={{
            border: '4px solid #1e3a8a',
            padding: '32px',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'white',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <img src={universityLogo} alt="University Logo" style={{ height: '80px', objectFit: 'contain' }} crossOrigin="anonymous" />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '32px', color: '#1e3a8a', margin: '0', fontWeight: 'bold' }}>Sharnbasva University</h1>
              <h2 style={{ fontSize: '20px', color: '#334155', margin: '5px 0 0 0' }}>Faculty of Engineering & Technology</h2>
              <p style={{ fontSize: '16px', color: '#64748b', margin: '5px 0 0 0' }}>Department of Computer Science & Design</p>
            </div>
          </div>

          <h1 style={{ fontSize: '40px', color: '#0f172a', margin: '8px 0', textTransform: 'uppercase', letterSpacing: '4px', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px' }}>
            Certificate of Completion
          </h1>

          <p style={{ fontSize: '18px', color: '#475569', margin: '8px 0' }}>
            This is to certify that
          </p>

          <h2 style={{ fontSize: '32px', color: '#1e3a8a', margin: '4px 0', fontStyle: 'italic', fontWeight: 'bold' }}>
            {studentName}
          </h2>

          <p style={{ fontSize: '18px', color: '#475569', margin: '8px 0', textAlign: 'center', maxWidth: '800px' }}>
            has successfully completed the assessment for
            <br />
            <strong style={{ color: '#0f172a', fontSize: '24px', display: 'inline-block', marginTop: '10px' }}>{quizTitle}</strong>
          </p>

          <div style={{ display: 'flex', gap: '40px', margin: '10px 0 0', backgroundColor: '#f8fafc', padding: '14px 36px', borderRadius: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Score</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{score} / {totalMarks}</p>
            </div>
            <div style={{ width: '2px', backgroundColor: '#cbd5e1' }}></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Percentage</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{percentage}%</p>
            </div>
          </div>

          {/* Signatures row (kept inside the visible area for PDF capture) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: '16px', padding: '14px 20px 0', borderTop: '1px solid #cbd5e1' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #0f172a', width: '200px', marginBottom: '10px', paddingBottom: '5px', fontSize: '16px', color: '#334155' }}>
                {format(date, 'MMMM do, yyyy')}
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Date of Completion</p>
            </div>

            {/* HOD Signature */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '200px', height: '50px', borderBottom: '1px solid #0f172a', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>HOD</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Head of Department</p>
            </div>

            {/* Coordinator Signature */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '200px', height: '50px', borderBottom: '1px solid #0f172a', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>Coordinator</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Department Coordinator</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
