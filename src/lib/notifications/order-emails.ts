/**
 * Email-уведомления по заказам: новый заказ, смена статуса, новое сообщение в чате.
 * Все функции безопасно вызывать «в фоне» (через after()) — они не бросают исключений.
 */

import { sendEmail } from "@/lib/email/send-email";
import { buildEmail, type LocalizedText } from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site";
import type { OrderAction } from "@/types/order";

type Recipient = "customer" | "maker";

function orderUrl(orderId: string): string {
  return `${getSiteUrl()}/orders/${orderId}`;
}

const OPEN_ORDER: LocalizedText = {
  cs: "Otevřít objednávku",
  en: "Open order",
};

const FOOTNOTE: LocalizedText = {
  cs: "Tento e-mail vám poslal PrintShare, protože máte na webu aktivní objednávku.",
  en: "You received this email from PrintShare because you have an active order on the site.",
};

async function loadOrderWithParties(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { id: true, email: true, name: true } },
      maker: {
        select: {
          name: true,
          owner: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });
}

type OrderWithParties = NonNullable<
  Awaited<ReturnType<typeof loadOrderWithParties>>
>;

function recipientOf(order: OrderWithParties, who: Recipient) {
  return who === "customer" ? order.customer : order.maker?.owner ?? null;
}

/** Мейкеру: пришёл новый заказ. */
export async function notifyMakerAboutNewOrder(orderId: string): Promise<void> {
  try {
    const order = await loadOrderWithParties(orderId);
    const maker = order?.maker?.owner;
    if (!order || !maker) return;

    const customerName = order.customer?.name ?? "—";

    await sendEmail(
      buildEmail({
        to: maker.email,
        subject: {
          cs: `Nová objednávka: ${order.fileName}`,
          en: `New order: ${order.fileName}`,
        },
        paragraphs: [
          {
            cs: `Dobrý den, ${maker.name}! Do vaší dílny „${order.maker?.name}“ přišla nová objednávka od zákazníka ${customerName}.`,
            en: `Hi ${maker.name}! Your workshop “${order.maker?.name}” has a new order from ${customerName}.`,
          },
          {
            cs: `Model: ${order.fileName}, ${Math.round(order.weightGrams)} g. Zkontrolujte detaily a navrhněte zákazníkovi podmínky.`,
            en: `Model: ${order.fileName}, ${Math.round(order.weightGrams)} g. Review the details and propose terms to the customer.`,
          },
        ],
        button: { url: orderUrl(order.id), label: OPEN_ORDER },
        footnote: FOOTNOTE,
      })
    );
  } catch (error) {
    console.error("[notifyMakerAboutNewOrder]", error);
  }
}

interface StatusNotice {
  to: Recipient;
  subject: LocalizedText;
  body: LocalizedText;
}

function statusNotices(
  action: OrderAction,
  actor: "customer" | "maker" | "admin"
): StatusNotice[] {
  switch (action) {
    case "propose_terms":
      return [
        {
          to: "customer",
          subject: { cs: "Maker navrhl podmínky", en: "The maker proposed terms" },
          body: {
            cs: "Maker zkontroloval váš model a navrhl cenu a podmínky. Potvrďte je, aby mohl začít tisknout.",
            en: "The maker reviewed your model and proposed a price and terms. Accept them so printing can start.",
          },
        },
      ];
    case "accept_terms":
      return [
        {
          to: "maker",
          subject: { cs: "Zákazník přijal podmínky", en: "The customer accepted the terms" },
          body: {
            cs: "Zákazník souhlasí s vašimi podmínkami. Můžete začít tisknout.",
            en: "The customer accepted your terms. You can start printing.",
          },
        },
      ];
    case "pay":
      return [
        {
          to: "maker",
          subject: { cs: "Objednávka je zaplacena", en: "The order has been paid" },
          body: {
            cs: "Zákazník objednávku zaplatil. Můžete začít tisknout.",
            en: "The customer paid for the order. You can start printing.",
          },
        },
      ];
    case "start_printing":
      return [
        {
          to: "customer",
          subject: { cs: "Tisk začal", en: "Printing has started" },
          body: {
            cs: "Maker začal tisknout váš model.",
            en: "The maker has started printing your model.",
          },
        },
      ];
    case "mark_shipped":
      return [
        {
          to: "customer",
          subject: { cs: "Objednávka je připravena / odeslána", en: "Your order is ready / shipped" },
          body: {
            cs: "Maker označil objednávku jako odeslanou nebo připravenou k vyzvednutí. Po převzetí prosím potvrďte příjem.",
            en: "The maker marked the order as shipped or ready for pickup. Please confirm receipt once you have it.",
          },
        },
      ];
    case "confirm_receipt":
      return [
        {
          to: "maker",
          subject: { cs: "Zákazník potvrdil převzetí", en: "The customer confirmed receipt" },
          body: {
            cs: "Zákazník potvrdil, že objednávku převzal. Děkujeme!",
            en: "The customer confirmed they received the order. Thank you!",
          },
        },
      ];
    case "cancel": {
      const notice = (to: Recipient): StatusNotice => ({
        to,
        subject: { cs: "Objednávka byla zrušena", en: "The order was cancelled" },
        body: {
          cs:
            actor === "admin"
              ? "Objednávku zrušil administrátor PrintShare."
              : actor === "maker"
                ? "Maker objednávku zrušil."
                : "Zákazník objednávku zrušil.",
          en:
            actor === "admin"
              ? "The order was cancelled by a PrintShare administrator."
              : actor === "maker"
                ? "The maker cancelled the order."
                : "The customer cancelled the order.",
        },
      });
      if (actor === "customer") return [notice("maker")];
      if (actor === "maker") return [notice("customer")];
      return [notice("customer"), notice("maker")];
    }
    default:
      return [];
  }
}

/** Второй стороне заказа: статус изменился. */
export async function notifyOrderStatusChange(
  orderId: string,
  action: OrderAction,
  actor: "customer" | "maker" | "admin"
): Promise<void> {
  try {
    const notices = statusNotices(action, actor);
    if (notices.length === 0) return;

    const order = await loadOrderWithParties(orderId);
    if (!order) return;

    for (const notice of notices) {
      const recipient = recipientOf(order, notice.to);
      if (!recipient) continue;

      await sendEmail(
        buildEmail({
          to: recipient.email,
          subject: {
            cs: `${notice.subject.cs}: ${order.fileName}`,
            en: `${notice.subject.en}: ${order.fileName}`,
          },
          paragraphs: [
            { cs: `Dobrý den, ${recipient.name}!`, en: `Hi ${recipient.name}!` },
            notice.body,
          ],
          button: { url: orderUrl(order.id), label: OPEN_ORDER },
          footnote: FOOTNOTE,
        })
      );
    }
  } catch (error) {
    console.error("[notifyOrderStatusChange]", error);
  }
}

/**
 * Получателю: новое сообщение в чате заказа.
 * Чтобы не заваливать почту, письмо уходит только на ПЕРВОЕ непрочитанное
 * сообщение: если отправитель уже писал после того, как получатель последний
 * раз открыл чат, второе письмо не отправляется.
 */
export async function notifyNewChatMessage(
  orderId: string,
  messageId: string
): Promise<void> {
  try {
    const [order, message] = await Promise.all([
      loadOrderWithParties(orderId),
      prisma.orderMessage.findUnique({
        where: { id: messageId },
        select: { senderId: true, body: true, createdAt: true, sender: { select: { name: true } } },
      }),
    ]);
    if (!order || !message) return;

    const customer = order.customer;
    const makerOwner = order.maker?.owner ?? null;

    let recipient: { id: string; email: string; name: string } | null = null;
    if (customer && message.senderId === customer.id) recipient = makerOwner;
    else if (makerOwner && message.senderId === makerOwner.id) recipient = customer;
    else return; // пишет админ/модератор — не уведомляем

    if (!recipient || recipient.id === message.senderId) return;

    const receipt = await prisma.orderReadReceipt.findUnique({
      where: { userId_orderId: { userId: recipient.id, orderId } },
      select: { lastReadAt: true },
    });

    const earlierUnread = await prisma.orderMessage.count({
      where: {
        orderId,
        senderId: message.senderId,
        id: { not: messageId },
        createdAt: {
          lte: message.createdAt,
          ...(receipt ? { gt: receipt.lastReadAt } : {}),
        },
      },
    });
    if (earlierUnread > 0) return;

    const preview =
      message.body.length > 500 ? `${message.body.slice(0, 500)}…` : message.body;

    await sendEmail(
      buildEmail({
        to: recipient.email,
        subject: {
          cs: `Nová zpráva k objednávce ${order.fileName}`,
          en: `New message about order ${order.fileName}`,
        },
        paragraphs: [
          {
            cs: `Dobrý den, ${recipient.name}! ${message.sender.name} vám napsal(a):`,
            en: `Hi ${recipient.name}! ${message.sender.name} sent you a message:`,
          },
        ],
        quote: preview,
        button: {
          url: orderUrl(order.id),
          label: { cs: "Odpovědět", en: "Reply" },
        },
        footnote: {
          cs: "Další zprávy vám pošleme e-mailem až poté, co si chat přečtete.",
          en: "We'll email you about further messages after you've read the chat.",
        },
      })
    );
  } catch (error) {
    console.error("[notifyNewChatMessage]", error);
  }
}
