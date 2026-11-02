"use client";

import { createSharedPoll } from "@/lib/polling/create-shared-poll";
import type { InboxResponse } from "@/types/inbox";

const EMPTY_INBOX: InboxResponse = { items: [], totalUnread: 0 };

const useInboxPoll = createSharedPoll<InboxResponse>({
  url: "/api/messages/inbox",
  intervalMs: 30000,
  empty: EMPTY_INBOX,
  parse: (json) => json as InboxResponse,
});

export function useMessageInbox(enabled: boolean) {
  const { data, refetch } = useInboxPoll(enabled);
  return { ...data, refetch };
}
