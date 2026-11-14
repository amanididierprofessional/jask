import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Plus } from "lucide-react";
import type { FeedItem } from "@/lib/queries";
import { classLabel, plural } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useInvite, useMyInvites } from "@/lib/mutations";
import { Avatar, Card, Chip } from "./ui";
import { HelperSheet } from "./HelperSheet";

type Helper = { id: string; full_name: string; avatar_url: string | null };

export function QuestionCard({ q, helper }: { q: FeedItem; helper?: Helper | null }) {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(false);
  const invites = useMyInvites();
  const invite = useInvite();
  const author = q.author;
  const course = q.course;
  const accepted = !!q.accepted_answer_id;
  const n = q.answer_count;
  const invited = helper ? invites.data?.has(`${q.id}:${helper.id}`) : false;

  const requireAuth = (fn: () => void) => () => (userId ? fn() : navigate({ to: "/auth" }));

  return (
    <Card>
      <Link to="/q/$questionId" params={{ questionId: q.id }} className="block">
        <div className="flex items-center gap-3">
          <Avatar name={author?.full_name ?? "Student"} url={author?.avatar_url} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{author?.full_name}</p>
            {author && classLabel(author) && <p className="text-[12px] text-mute">{classLabel(author)}</p>}
          </div>
          {course && <Chip>{course.name}</Chip>}
        </div>
        <p className="mt-3.5 font-display text-[18px] font-extrabold leading-snug">{q.title}</p>
      </Link>

      {helper ? (
        <>
          {accepted ? (
            <span className="mt-3 inline-flex rounded-full bg-win/15 px-3 py-1 text-[12px] font-bold text-win-ink">
              ✓ {n} verified {n === 1 ? "solution" : "solutions"}
            </span>
          ) : (
            <span className="mt-3 inline-flex rounded-full bg-ground px-3 py-1 text-[12px] font-bold text-mute">
              {n === 0 ? "No answers yet" : plural(n, "answer", "answers")}
            </span>
          )}
          <div className="mt-4 flex items-center gap-3 rounded-[18px] bg-ground p-3">
            <Avatar name={helper.full_name} url={helper.avatar_url} size={36} ring="win" />
            <p className="flex-1 text-[13px] leading-snug">
              <b>{helper.full_name}</b> has completed this module
            </p>
            <button
              type="button"
              disabled={invited || invite.isPending}
              onClick={requireAuth(() => invite.mutate({ questionId: q.id, helperId: helper.id, helperName: helper.full_name }))}
              className="flex h-9 items-center gap-1 rounded-full px-3 text-[13px] font-bold text-brand disabled:text-win-ink"
            >
              {invited ? (
                <>
                  <Check className="h-4 w-4" /> Invited
                </>
              ) : (
                "Invite to answer"
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={requireAuth(() => setSheet(true))}
            className="flex h-11 items-center gap-1.5 rounded-full border border-ink/10 px-4 text-[13px] font-semibold"
          >
            <Plus className="h-4 w-4" /> Tag a helper
          </button>
          <Link
            to="/q/$questionId"
            params={{ questionId: q.id }}
            className={
              accepted
                ? "flex h-11 items-center gap-1.5 rounded-full bg-win px-4 font-display text-[13px] font-bold text-brand-foreground shadow-win"
                : "flex h-11 items-center gap-1.5 rounded-full bg-brand/10 px-4 font-display text-[13px] font-bold text-brand"
            }
          >
            {accepted ? `✓ ${n} verified ${n === 1 ? "answer" : "answers"}` : n === 0 ? "Be the first to answer" : plural(n, "answer", "answers")}
          </Link>
        </div>
      )}
      {sheet && course && (
        <HelperSheet
          open={sheet}
          onOpenChange={setSheet}
          questionId={q.id}
          courseId={course.id}
          courseName={course.name}
          excludeIds={author ? [author.id] : []}
        />
      )}
    </Card>
  );
}
