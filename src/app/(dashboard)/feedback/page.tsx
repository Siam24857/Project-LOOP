import { FeedbackInbox } from "@/components/feedback/feedback-inbox"

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const params = await searchParams
  return <FeedbackInbox initialSearch={params.search ?? ""} />
}