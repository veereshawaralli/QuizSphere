// Simple footer with university info

export default function Footer() {
  return (
    <footer className="border-t bg-primary py-6">
      <div className="container mx-auto px-4 text-center text-sm text-primary-foreground/70">
        <p>© {new Date().getFullYear()} Sharnbasva University — Department of Computer Science &amp; Design</p>
        <p className="mt-1">CSD Quiz &amp; Learning Portal</p>
      </div>
    </footer>
  );
}
