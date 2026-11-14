import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { coursesQuery, institutionsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { BrandMark, Card, PrimaryButton } from "@/components/jask/ui";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your profile — Jask" }, { name: "description", content: "Tell Jask your university, major and courses." }] }),
  component: Onboarding,
});

type St = "enrolled" | "completed";

function Onboarding() {
  const { userId, profile } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const inst = useQuery(institutionsQuery());
  const courses = useQuery(coursesQuery());
  const [name, setName] = useState("");
  const [instId, setInstId] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [picks, setPicks] = useState<Record<string, St>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name); setInstId(profile.institution_id ?? ""); setMajor(profile.major ?? ""); setYear(profile.grad_year ? String(profile.grad_year) : "");
    supabase.from("enrollments").select("course_id, status").eq("user_id", profile.id).then(({ data }) => setPicks(Object.fromEntries((data ?? []).map((e) => [e.course_id, e.status as St]))));
  }, [profile]);

  const cycle = (id: string) => setPicks((p) => { const n = { ...p }; if (!n[id]) n[id] = "enrolled"; else if (n[id] === "enrolled") n[id] = "completed"; else delete n[id]; return n; });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId) return toast.error("Pick your university");
    const y = Number(year);
    if (year && (y < 2000 || y > 2040)) return toast.error("Enter a valid graduation year");
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: name.trim().slice(0, 80) || "Student", institution_id: instId, major: major.trim().slice(0, 40) || null, grad_year: year ? y : null, onboarded: true }).eq("id", userId!);
    if (error) { setBusy(false); return toast.error(error.message); }
    await supabase.from("enrollments").delete().eq("user_id", userId!);
    const rows = Object.entries(picks).filter(([cid]) => courses.data?.find((c) => c.id === cid)?.institution_id === instId).map(([course_id, status]) => ({ user_id: userId!, course_id, status }));
    if (rows.length) await supabase.from("enrollments").insert(rows);
    qc.invalidateQueries();
    toast.success("Profile saved");
    nav({ to: "/" });
  };
  const field = "h-12 w-full rounded-[18px] border border-ink/10 bg-card px-4 text-[15px] outline-none focus:border-brand";
  return (
    <form onSubmit={save} className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 py-8">
      <BrandMark /><h1 className="text-[26px] font-black leading-tight">Set up your profile</h1>
      <Card className="flex flex-col gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={field} />
        <select value={instId} onChange={(e) => setInstId(e.target.value)} className={field}><option value="">Select your university</option>{inst.data?.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
        <div className="flex gap-3"><input value={major} onChange={(e) => setMajor(e.target.value)} placeholder="Major (e.g. CS)" className={field} /><input value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Grad year" className={field} /></div>
      </Card>
      {instId && <Card><p className="font-display text-[16px] font-extrabold">Your courses</p><p className="text-[12px] text-mute">Tap once: taking it now. Twice: completed (you can help others).</p>
        <div className="mt-3 flex flex-wrap gap-2">{courses.data?.filter((c) => c.institution_id === instId).map((c) => <button type="button" key={c.id} onClick={() => cycle(c.id)} className={cn("h-9 rounded-full px-3 text-[13px] font-semibold", picks[c.id] === "completed" ? "bg-win text-brand-foreground" : picks[c.id] ? "bg-brand text-brand-foreground" : "bg-brand/10 text-brand")}>{picks[c.id] === "completed" ? "✓ " : ""}{c.name}</button>)}</div></Card>}
      <PrimaryButton type="submit" disabled={busy}>{busy ? "Saving…" : "Continue"}</PrimaryButton>
    </form>
  );
}
