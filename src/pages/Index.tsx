// Paper & Ink landing — editorial stacked sections, oversized display type,
// hairline rules, monospaced metadata. Built for the CSD Department.

import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useReveal } from '@/hooks/use-reveal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Capabilities — four primary instruments of the portal.
const capabilities = [
  {
    no: '01',
    title: 'Live quizzes',
    body: 'Timed, multiple-choice assessments authored by faculty with instant, transparent grading at submission.',
  },
  {
    no: '02',
    title: 'Time-bound rigor',
    body: 'Every attempt runs on a countdown. Auto-submit on time-up and full-screen blur keeps the work honest.',
  },
  {
    no: '03',
    title: 'Verified certificates',
    body: 'Cross 70% and receive a department-issued PDF, QR-verifiable against the portal’s public record.',
  },
  {
    no: '04',
    title: 'Faculty materials',
    body: 'Lecture notes, references and reading lists curated by faculty, organised by course and semester.',
  },
];

// Numbers — restrained metadata.
const figures = [
  { k: 'Department', v: 'CS & Design' },
  { k: 'Established', v: '2023' },
  { k: 'Programs', v: 'BTech · MTech · PhD' },
  { k: 'Campus', v: 'Kalaburagi' },
];

// Index — the table of contents for the page itself.
const contents = [
  { no: '01', label: 'The portal', href: '#portal' },
  { no: '02', label: 'Instruments', href: '#instruments' },
  { no: '03', label: 'Manifesto', href: '#manifesto' },
  { no: '04', label: 'Begin', href: '#begin' },
];

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useReveal();

  // Authenticated users go straight to their dashboard.
  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  // Live clock for the masthead — small editorial flourish.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const today = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      {/* ── 01. MASTHEAD / HERO ───────────────────────────────────── */}
      <section id="portal" className="border-b border-foreground/15">
        <div className="mx-auto max-w-[1440px] px-6 pt-10 pb-24 md:pt-16 md:pb-32">
          {/* Top metadata row — issue, date, live time */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground/15 pb-6">
            <p className="eyebrow text-foreground/55">Issue №24 · Volume IV</p>
            <p className="eyebrow text-foreground/55 hidden md:block">{today}</p>
            <p className="eyebrow text-foreground/55">IST {time}</p>
          </div>

          {/* Hero grid */}
          <div className="grid gap-12 pt-14 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-3 reveal">
              <p className="section-num">§ 01 — The portal</p>
              <p className="mt-6 max-w-[18rem] text-sm leading-relaxed text-foreground/75">
                A learning instrument for the Department of
                <span className="text-foreground"> Computer Science &amp; Design</span>,
                Sharnbasva University. Built for students who take the work
                seriously and faculty who teach it honestly.
              </p>

              <div className="mt-12 hidden md:block">
                <p className="eyebrow text-foreground/55">Contents</p>
                <ul className="mt-3 space-y-1 font-mono text-[11px] text-foreground/70">
                  {contents.map((c) => (
                    <li key={c.no}>
                      <a href={c.href} className="link-underline">
                        {c.no} &nbsp;{c.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="md:col-span-9 reveal reveal-delay-1">
              <h1 className="font-heading font-medium tracking-[-0.04em] leading-[0.88]
                              text-[14vw] md:text-[10.5vw] lg:text-[9.5rem]">
                Learn deeply.<br />
                Test <span className="display-serif">honestly</span>.<br />
                Ship often<span className="caret">.</span>
              </h1>

              <div className="mt-12 grid gap-10 md:grid-cols-12 md:items-end">
                <p className="md:col-span-7 max-w-xl text-lg leading-relaxed text-foreground/80 md:text-xl">
                  The official quiz and learning portal of the CSD Department —
                  a quiet, focused environment for assessments, study, and the
                  slow accumulation of understanding.
                </p>

                <div className="md:col-span-5 flex flex-wrap items-center gap-3 md:justify-end">
                  <Link to="/login" className="btn-ink">
                    Enter portal
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/login?role=faculty" className="btn-paper">
                    Faculty access
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Figures table — restrained metadata grid */}
          <div className="mt-24 grid grid-cols-2 border-t border-foreground/15 md:grid-cols-4">
            {figures.map((f, i) => (
              <div
                key={f.k}
                className={`flex flex-col gap-3 py-8 ${i > 0 ? 'md:border-l border-foreground/15 md:pl-8' : ''}`}
              >
                <p className="eyebrow text-foreground/55">{f.k}</p>
                <p className="font-heading text-2xl font-medium leading-tight tracking-tight md:text-3xl">
                  {f.v}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 02. INSTRUMENTS ──────────────────────────────────────── */}
      <section id="instruments" className="border-b border-foreground/15">
        <div className="mx-auto max-w-[1440px] px-6 py-24 md:py-32">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <div className="md:sticky md:top-32">
                <p className="section-num reveal">§ 02 — Instruments</p>
                <h2 className="mt-6 font-heading text-5xl font-medium leading-[0.95] tracking-tight md:text-6xl reveal reveal-delay-1">
                  Four tools.<br />
                  No <span className="display-serif">decoration</span>.
                </h2>
                <p className="mt-6 max-w-sm text-sm leading-relaxed text-foreground/70 reveal reveal-delay-2">
                  Each instrument does one thing brilliantly so the work itself
                  stays in the foreground. The portal recedes; the learning leads.
                </p>
                <div className="mt-10 hairline-coral max-w-[14rem]" />
              </div>
            </div>

            <ul className="md:col-span-8">
              {capabilities.map((c, i) => (
                <li
                  key={c.no}
                  className={`group reveal reveal-delay-${Math.min(i + 1, 3)} grid grid-cols-12 gap-6 border-t border-foreground/15 py-10 transition-colors first:border-t-0 hover:bg-foreground/[0.02]`}
                >
                  <span className="col-span-2 font-mono text-xs text-foreground/55 md:col-span-1">
                    {c.no}
                  </span>
                  <div className="col-span-10 md:col-span-11">
                    <h3 className="font-heading text-3xl font-medium leading-tight tracking-tight md:text-5xl">
                      {c.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/70 md:text-base">
                      {c.body}
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 text-foreground/55 transition-colors group-hover:text-foreground">
                      <span className="h-px w-6 bg-current transition-all duration-500 group-hover:w-12" />
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 03. MANIFESTO (ink slab) ─────────────────────────────── */}
      <section id="manifesto" className="bg-foreground text-background">
        <div className="mx-auto max-w-[1440px] px-6 py-24 md:py-40">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-3">
              <p className="eyebrow text-background/55">§ 03 — Manifesto</p>
            </div>
            <blockquote className="md:col-span-9">
              <p className="font-heading text-3xl font-medium leading-[1.15] tracking-tight md:text-5xl lg:text-6xl">
                <span className="text-background/50">"</span>
                Knowledge is not a checkbox. It compounds quietly, in the
                <span className="display-serif"> space between attempts</span> —
                the wrong answers you sit with, the questions you return to.
                This portal is built for that pace.
                <span className="text-background/50">"</span>
              </p>
              <footer className="mt-12 flex items-center gap-4">
                <span className="h-px w-12 bg-background" />
                <span className="eyebrow text-background/70">
                  Department of Computer Science &amp; Design
                </span>
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ── 04. BEGIN — CTA ──────────────────────────────────────── */}
      <section id="begin" className="border-b border-foreground/15">
        <div className="mx-auto max-w-[1440px] px-6 py-24 md:py-32">
          <div className="grid items-end gap-10 md:grid-cols-12 reveal">
            <div className="md:col-span-8">
              <p className="section-num">§ 04 — Begin</p>
              <h2 className="mt-6 font-heading text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
                Ready when<br />
                <span className="display-serif">you</span> are.
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/70">
                Sign in with your university account to take quizzes, access
                materials, and track your progress across the semester.
              </p>
            </div>
            <div className="md:col-span-4 flex flex-wrap items-center gap-3 md:justify-end">
              <Link to="/login" className="btn-ink">
                Sign in to begin
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
