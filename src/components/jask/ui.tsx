import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";
import { avatarSrc } from "@/lib/avatars";
import { initials } from "@/lib/format";

export function Avatar({
  name,
  url,
  size = 40,
  ring,
  className,
}: {
  name: string;
  url?: string | null | undefined;
  size?: number;
  ring?: "white" | "brand" | "win" | undefined;
  className?: string | undefined;
}) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : avatarSrc(url);
  const ringCls = ring === "white" ? "ring-2 ring-card" : ring === "brand" ? "ring-2 ring-brand" : ring === "win" ? "ring-2 ring-win" : "";
  const style = { width: size, height: size };
  if (src)
    return (
      <img src={src} onError={() => setFailed(true)} alt={name} loading="lazy" width={size} height={size} style={style} className={cn("shrink-0 rounded-full object-cover", ringCls, className)} />
    );
  return (
    <span
      style={{ ...style, fontSize: Math.max(10, size * 0.34) }}
      className={cn("grid shrink-0 place-items-center rounded-full bg-secondary font-display font-black text-brand", ringCls, className)}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-brand/10 px-3 py-1 text-[12px] font-semibold text-brand", className)}>
      {children}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <article className={cn("rounded-[28px] bg-card p-5 shadow-card", className)}>{children}</article>;
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 font-display text-[13px] font-black text-brand", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-brand-foreground"><CircleHelp className="h-6 w-6" strokeWidth={2.5} /></span>
      Jask
    </div>
  );
}

export function BackHeader({ title, subtitle, right, to = "/" }: { title: string; subtitle?: ReactNode; right?: ReactNode; to?: string }) {
  return (
    <header className="flex items-center gap-3 px-4 pb-2 pt-4">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = to))}
        aria-label="Back"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-card shadow-card"
      >
        <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[20px] font-black leading-tight">{title}</h1>
        {subtitle && <p className="truncate text-[12px] font-semibold text-brand">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center px-6 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 font-display text-[20px] font-black text-brand">?</span>
      <p className="mt-3 font-display text-[18px] font-extrabold">{title}</p>
      <p className="mt-1 max-w-xs text-[14px] text-mute">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function CardSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-ground" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-ground" />
          <div className="h-2.5 w-12 rounded bg-ground" />
        </div>
      </div>
      <div className="mt-4 h-4 w-11/12 rounded bg-ground" />
      <div className="mt-2 h-4 w-2/3 rounded bg-ground" />
    </Card>
  );
}

export function PrimaryButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "flex h-14 items-center justify-center gap-2 rounded-full bg-brand px-6 font-display text-[16px] font-extrabold text-brand-foreground shadow-brand transition active:scale-[0.98] disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className={cn("whitespace-pre-wrap", className)}>
      {parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>))}
    </p>
  );
}

export function SignInLink({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Link to="/auth" className={className}>
      {children}
    </Link>
  );
}
