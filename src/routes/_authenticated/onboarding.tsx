import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { institutionsQuery } from '@/lib/queries';
import { departmentsQuery } from '@/lib/social-queries';
import { validStudyYear } from '@/lib/social-rules';
import { pageHead } from '@/lib/head';
import { BrandMark } from '@/components/jask/ui';
import { NotificationSetup } from '@/components/jask/NotificationSetup';

export const Route = createFileRoute('/_authenticated/onboarding')({
  head: () => pageHead('Set up your profile', 'Your university, department, campus and current year.'),
  component: Onboarding,
});

function Onboarding() {
  const { userId, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const institutions = useQuery(institutionsQuery());
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [newCollege, setNewCollege] = useState('');
  const [major, setMajor] = useState('');
  const [department, setDepartment] = useState('');
  const [campus, setCampus] = useState('');
  const [year, setYear] = useState('');
  const [busy, setBusy] = useState(false);
  const [notificationSetup, setNotificationSetup] = useState(false);
  const departments = useQuery(departmentsQuery(institution));

  useEffect(() => {
    if (!profile || !userId) return;
    setName(profile.full_name);
    setInstitution(profile.institution_id ?? '');
    setMajor(profile.major ?? '');
    setDepartment(profile.department_id ?? '');
    setYear(profile.study_year ? String(profile.study_year) : '');

    const setupKey = `jask-notification-setup:${userId}`;
    if (!profile.onboarded && !window.localStorage.getItem(setupKey)) {
      window.localStorage.setItem(setupKey, 'shown');
      setNotificationSetup(true);
    }
  }, [profile, userId]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) return;
    if (year && !validStudyYear(Number(year))) {
      toast.error('Enter a whole study year from 1 to 8');
      return;
    }
    setBusy(true);
    try {
      let institutionId = institution;
      if (institution === 'new') {
        const clean = newCollege.trim();
        if (clean.length < 2) throw new Error('Enter your college name');
        const existing = institutions.data?.find((item) => item.name.toLowerCase() === clean.toLowerCase());
        if (existing) {
          institutionId = existing.id;
        } else {
          const { data, error } = await supabase.from('institutions').insert({ name: clean }).select('id').single();
          if (error) throw error;
          institutionId = data.id;
          queryClient.invalidateQueries({ queryKey: ['institutions'] });
        }
      }
      if (!institutionId) throw new Error('Select your college');

      let departmentId = department;
      if (major.trim() && !departmentId) {
        const { data, error } = await supabase.from('departments').insert({
          institution_id: institutionId,
          name: major.trim(),
          code: major.trim().slice(0, 20),
          campus: campus.trim() || null,
        }).select('id').single();
        if (error) throw error;
        departmentId = data.id;
        queryClient.invalidateQueries({ queryKey: ['departments'] });
      }

      const { error } = await supabase.from('profiles').update({
        full_name: name.trim(),
        institution_id: institutionId,
        major: major.trim() || null,
        department_id: departmentId || null,
        study_year: year ? Number(year) : null,
        onboarded: true,
      }).eq('id', userId);
      if (error) throw error;
      queryClient.invalidateQueries();
      toast.success('Profile saved');
      navigate({ to: '/' });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const field = 'mt-1 h-12 w-full rounded-lg border bg-card px-3 text-sm outline-none focus:border-brand';
  const matches = departments.data?.filter((item) => `${item.name} ${item.campus ?? ''}`.toLowerCase().includes(major.toLowerCase())).slice(0, 12);

  return (
    <>
      <form onSubmit={save} className="mx-auto max-w-[480px] space-y-5 px-5 py-10">
        <BrandMark />
        <h1 className="text-2xl font-black">Your profile</h1>
        <label className="block text-sm font-semibold">
          Full name
          <input aria-label="Full name" required value={name} maxLength={80} onChange={(event) => setName(event.target.value)} className={field} />
        </label>
        <label className="block text-sm font-semibold">
          University / college
          <select
            aria-label="University / college"
            required
            value={institution}
            onChange={(event) => {
              setInstitution(event.target.value);
              setDepartment('');
              setMajor('');
            }}
            className={field}
          >
            <option value="">Select your college</option>
            {institutions.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            <option value="new">Don't see my college</option>
          </select>
        </label>
        {institution === 'new' && (
          <label className="block text-sm font-semibold">
            College name
            <input aria-label="College name" required value={newCollege} onChange={(event) => setNewCollege(event.target.value)} className={field} />
          </label>
        )}
        <label className="block text-sm font-semibold">
          Department / major
          <input
            aria-label="Department / major"
            autoComplete="off"
            value={major}
            onChange={(event) => {
              setMajor(event.target.value);
              setDepartment('');
            }}
            className={field}
            placeholder="Search your department"
          />
        </label>
        {!department && major && matches && matches.length > 0 && (
          <div className="max-h-64 space-y-1 overflow-y-auto border-b">
            {matches.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start whitespace-normal py-3 text-left"
                onClick={() => {
                  setMajor(item.name);
                  setDepartment(item.id);
                  setCampus(item.campus ?? '');
                }}
              >
                <span>
                  {item.name}
                  <span className="block text-xs font-normal text-mute">{item.campus ?? 'Campus not listed by the university'}</span>
                </span>
              </Button>
            ))}
          </div>
        )}
        {major && !department && (
          <label className="block text-sm font-semibold">
            Campus (for a new department)
            <input aria-label="Campus" value={campus} onChange={(event) => setCampus(event.target.value)} className={field} />
          </label>
        )}
        <label className="block text-sm font-semibold">
          Year
          <input aria-label="Year" type="number" min={1} max={8} step={1} value={year} onChange={(event) => setYear(event.target.value)} className={field} placeholder="1, 2, 3…" />
        </label>
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-full">{busy ? 'Saving…' : 'Save profile'}</Button>
      </form>
      {notificationSetup && userId && <NotificationSetup userId={userId} onDone={() => setNotificationSetup(false)} />}
    </>
  );
}
