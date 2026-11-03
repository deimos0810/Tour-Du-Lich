import TicketDetailClient, { TicketData } from './TicketDetailClient';

export const dynamic = 'force-dynamic';

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ maDon: string }>;
  searchParams: Promise<{ khach?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const maDon = decodeURIComponent(resolvedParams.maDon);
  const initialKhachId = resolvedSearch?.khach ? Number(resolvedSearch.khach) : null;

  let initialTicket: TicketData | null = null;
  try {
    const res = await fetch(`http://127.0.0.1:4000/api/bookings/ticket/${encodeURIComponent(maDon)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      initialTicket = (await res.json()) as TicketData;
    }
  } catch {
    // Fallback to client-side fetch if SSR fetch fails
  }

  return (
    <TicketDetailClient
      maDon={maDon}
      initialTicket={initialTicket}
      initialKhachId={initialKhachId}
    />
  );
}
