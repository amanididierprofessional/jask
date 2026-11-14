import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { helpersQuery } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { useInvite, useMyInvites } from "@/lib/mutations";
import { classLabel } from "@/lib/format";
import { Avatar } from "./ui";

export function HelperSheet({
  open,
  onOpenChange,
  questionId,
  courseId,
  courseName,
  excludeIds = [],
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  questionId: string;
  courseId: string;
  courseName: string;
  excludeIds?: string[];
}) {
  const { userId } = useAuth();
  const helpers = useQuery({ ...helpersQuery(), enabled: open });
  const invites = useMyInvites();
  const invite = useInvite();
  const list = (helpers.data ?? [])
    .filter((e) => e.course_id === courseId && e.user && e.user.id !== userId && !excludeIds.includes(e.user.id))
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "completed" ? -1 : 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-[28px] border-0 p-5">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-[20px] font-black">Tag a helper</DialogTitle>
          <DialogDescription className="text-mute">Classmates who know {courseName}. They’ll get a notification.</DialogDescription>
        </DialogHeader>
        <div className="mt-1 flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {helpers.isLoading && <p className="py-6 text-center text-[13px] text-mute">Finding classmates…</p>}
          {!helpers.isLoading && list.length === 0 && (
            <p className="py-6 text-center text-[13px] text-mute">No classmates have joined this module yet.</p>
          )}
          {list.map((e) => {
            const u = e.user!;
            const sent = invites.data?.has(`${questionId}:${u.id}`);
            return (
              <div key={u.id} className="flex min-h-[60px] items-center gap-3 rounded-[18px] bg-ground p-3">
                <Avatar name={u.full_name} url={u.avatar_url} size={36} ring={e.status === "completed" ? "win" : undefined} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">{u.full_name}</p>
                  <p className="text-[12px] text-mute">
                    {classLabel(u)} · {e.status === "completed" ? "Completed this module" : "Taking it now"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={sent || invite.isPending}
                  onClick={() => invite.mutate({ questionId, helperId: u.id, helperName: u.full_name })}
                  className="flex h-9 items-center gap-1 rounded-full px-3 text-[13px] font-bold text-brand disabled:text-win-ink"
                >
                  {sent ? (
                    <>
                      <Check className="h-4 w-4" /> Invited
                    </>
                  ) : (
                    "Invite"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
