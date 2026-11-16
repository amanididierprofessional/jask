import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Choices = {
  enabled: boolean;
  courses: boolean;
  communities: boolean;
  campus: boolean;
};

const initialChoices: Choices = {
  enabled: true,
  courses: true,
  communities: true,
  campus: false,
};

function ChoiceCard({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={title}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45',
        checked ? 'border-brand bg-secondary' : 'bg-card',
      )}
    >
      <span className={cn(
        'grid h-6 w-6 shrink-0 place-items-center rounded-full border',
        checked ? 'border-brand bg-brand text-brand-foreground' : 'bg-card',
      )}>
        {checked && <Check className="h-4 w-4" strokeWidth={3} />}
      </span>
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-0.5 block text-xs text-mute">{description}</span>
      </span>
    </button>
  );
}

export function NotificationSetup({
  userId,
  onDone,
}: {
  userId: string;
  onDone: () => void;
}) {
  const [choices, setChoices] = useState<Choices>(initialChoices);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from('notification_preferences').upsert({
        user_id: userId,
        ...choices,
        push_enabled: false,
      });
      if (error) throw error;
      toast.success('Notification choices saved');
      onDone();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onDone(); }}>
      <DialogContent className="max-w-[420px] rounded-[28px] p-5 sm:p-6">
        <DialogHeader>
          <span className="mb-2 grid h-11 w-11 place-items-center rounded-full bg-secondary text-brand">
            <Bell className="h-5 w-5" />
          </span>
          <DialogTitle className="text-xl font-black">What should Jask tell you?</DialogTitle>
          <DialogDescription>Choose your updates now. You can change them anytime in your profile.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5">
          <ChoiceCard
            title="Jask notifications"
            description="Turn all Jask updates on or off."
            checked={choices.enabled}
            onChange={() => setChoices((current) => ({ ...current, enabled: !current.enabled }))}
          />
          <ChoiceCard
            title="My courses"
            description="Questions and accepted answers from your courses."
            checked={choices.enabled && choices.courses}
            disabled={!choices.enabled}
            onChange={() => setChoices((current) => ({ ...current, courses: !current.courses }))}
          />
          <ChoiceCard
            title="My communities"
            description="New activity from communities you join."
            checked={choices.enabled && choices.communities}
            disabled={!choices.enabled}
            onChange={() => setChoices((current) => ({ ...current, communities: !current.communities }))}
          />
          <ChoiceCard
            title="My whole campus"
            description="Discover questions from across your campus."
            checked={choices.enabled && choices.campus}
            disabled={!choices.enabled}
            onChange={() => setChoices((current) => ({ ...current, campus: !current.campus }))}
          />
        </div>
        <Button className="h-12 w-full rounded-full" disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save notification choices'}
        </Button>
        <button type="button" disabled={busy} onClick={onDone} className="text-sm font-semibold text-mute">
          Not now
        </button>
      </DialogContent>
    </Dialog>
  );
}
