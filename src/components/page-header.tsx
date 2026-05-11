export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        {eyebrow && <p className="tagline mb-2">{eyebrow}</p>}
        <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
