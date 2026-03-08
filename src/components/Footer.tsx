// Simple footer with university info

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-primary py-8">
      <div className="container mx-auto px-4 text-center text-sm text-primary-foreground/60">
        <p>© {new Date().getFullYear()} Sharnbasva University — Department of Computer Science &amp; Design</p>
        <p className="mt-1.5 text-primary-foreground/40">CSD Quiz &amp; Learning Portal</p>
      </div>
    </footer>
  );
}
