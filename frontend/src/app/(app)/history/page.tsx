import type { Metadata } from "next";

import { HistoryView, type HistoryFilter } from "@/features/history/history-view";

export const metadata: Metadata = { title: "History" };

const FILTERS: HistoryFilter[] = ["all", "image", "video", "audio"];

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const { type } = await searchParams;
  const initialFilter = FILTERS.includes(type as HistoryFilter) ? (type as HistoryFilter) : "all";
  return <HistoryView initialFilter={initialFilter} />;
}
