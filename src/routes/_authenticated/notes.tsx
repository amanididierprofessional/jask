import { pageHead } from "@/lib/head";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { myBookmarksQuery, type FeedItem } from "@/lib/queries";
import { CardSkeleton, EmptyState } from "@/components/jask/ui";
import { QuestionCard } from "@/components/jask/QuestionCard";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => pageHead("Notes", "Your saved questions and answers on Jask."),
  component: Notes,
});

function Notes() {
  const { userId } = useAuth();
  const b = useQuery(myBookmarksQuery(userId));
  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <h1 className="px-1 text-[24px] font-black">Notes</h1>
      {b.isLoading && <CardSkeleton />}
      {b.data?.length === 0 && <EmptyState title="Nothing saved yet" body="Tap “Save to notes” on any answer to keep it for exam time." />}
      {b.data?.map((x) => x.question && <QuestionCard key={x.question_id} q={x.question as FeedItem} />)}
    </div>
  );
}
