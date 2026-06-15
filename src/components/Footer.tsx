// Editorial footer — colophon, sitemap, hairline rules, ink on paper.

import { Link } from 'react-router-dom';

const sitemap = [
  {
    label: 'Portal',
    items: [
      { label: 'Quizzes', to: '/quizzes' },
      { label: 'Study Materials', to: '/materials' },
      { label: 'Results', to: '/results' },
    ],
  },
  {
    label: 'Department',
    items: [
      { label: 'About CSD', to: '/' },
      { label: 'Faculty', to: '/login?role=faculty' },
      { label: 'Programs', to: '/' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Sign In', to: '/login' },
      { label: 'Verify Certificate', to: '/verify' },
      { label: 'Reset Password', to: '/login' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-foreground/15 bg-background text-foreground">
      {/* Closing statement band */}
      <section className="border-b border-foreground/15">
        <div className="mx-auto max-w-[1440px] px-6 py-20 md:py-28">
          <p className="eyebrow text-foreground/55">§ Closing</p>
          <h3 className="mt-4 font-heading text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
            A quiet place<br />
            for <span className="display-serif">serious</span> work.
          </h3>
        </div>
      </section>

      {/* Sitemap */}
      <section className="border-b border-foreground/15">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow text-foreground/55">Colophon</p>
            <p className="mt-4 font-heading text-2xl leading-tight tracking-tight">
              The CSD <span className="display-serif">Portal</span>
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-foreground/70">
              Set in Space Grotesk &amp; DM Sans. A learning instrument for the
              Department of Computer Science &amp; Design.
            </p>
            <div className="mt-6 h-px w-12 bg-foreground" />
            <p className="mt-3 eyebrow text-foreground/55">Version 4.0 · {year}</p>
          </div>

          {sitemap.map((col) => (
            <div key={col.label} className="md:col-span-2">
              <p className="eyebrow text-foreground/55">{col.label}</p>
              <ul className="mt-4 space-y-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="link-underline text-sm text-foreground/80 hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-2">
            <p className="eyebrow text-foreground/55">Location</p>
            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              Sharnbasva University<br />
              Kalaburagi, Karnataka<br />
              India · 585 102
            </p>
          </div>
        </div>
      </section>

      {/* Legal strip */}
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-2 px-6 py-5 md:flex-row md:items-center">
        <p className="eyebrow text-foreground/55">
          © {year} Sharnbasva University. All rights reserved.
        </p>
        <p className="eyebrow text-foreground/55">
          Issue №24 · AY 2025—26
        </p>
      </div>
    </footer>
  );
}
