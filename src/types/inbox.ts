export interface InboxMessageItem {
  orderId: string;
  fileName: string;
  counterpartyName: string;
  messageId: string;
  preview: string;
  senderName: string;
  createdAt: string;
  unreadCount: number;
}

export interface InboxResponse {
  items: InboxMessageItem[];
  totalUnread: number;
}
