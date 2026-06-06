import QuestionsList from "./questions-list";
import { getQuestionsPage } from "@/lib/questions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function Page() {
  const { questions, hasMore } = await getQuestionsPage(0, PAGE_SIZE);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          Kealvi
        </h1>

        <p className="mx-auto max-w-xl text-gray-600">
          A community-driven Q&A platform where users can ask questions,
          share images, discover answers, and vote on discussions that matter.
        </p>
      </div>

      <QuestionsList
        initialQuestions={questions}
        initialHasMore={hasMore}
      />
    </main>
  );
}