export default function SharedReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="antialiased min-h-screen text-sm" style={{ background: "oklch(0.07 0.015 265)" }}>
      {children}
    </div>
  );
}
