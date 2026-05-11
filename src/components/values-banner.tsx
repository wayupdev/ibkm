import { BookOpen, Compass, Share2, Sparkles } from "lucide-react";

const values = [
  { icon: BookOpen, label: "Apprendre" },
  { icon: Compass,  label: "Comprendre" },
  { icon: Share2,   label: "Partager" },
  { icon: Sparkles, label: "Transmettre" },
];

export default function ValuesBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-ink text-white p-6 sm:p-8 mb-6">
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background:
            "radial-gradient(700px circle at 10% 10%, #f96100 0%, transparent 55%), radial-gradient(500px circle at 95% 90%, #009807 0%, transparent 55%)",
        }}
      />
      <p className="relative tagline text-white/80">Notre philosophie</p>
      <h2 className="relative font-display font-bold text-2xl sm:text-3xl mt-2 leading-tight">
        Apprendre · Comprendre · Partager · Transmettre
      </h2>
      <ul className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {values.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur-sm"
          >
            <Icon className="w-4 h-4 text-brand-400" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
