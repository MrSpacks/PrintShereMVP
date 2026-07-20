import { cn } from "@/lib/utils";
import {
  type AppPageWidth,
  getAppPageWidthClass,
} from "@/lib/layout/page-width";

interface AppPageProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Ширина контентной колонки; по умолчанию max-w-5xl */
  width?: AppPageWidth;
  className?: string;
  /** Кнопки справа от заголовка (обновить, сохранить и т.д.) */
  actions?: React.ReactNode;
  /** Для страниц со своим заголовком внутри (деталь заказа) */
  hideHeader?: boolean;
}

/**
 * Общая обёртка внутренних страниц: профиль, дашборд, заказы.
 * Даёт единые отступы и ширину, чтобы контент не был узкой колонкой по центру.
 */
export function AppPage({
  title,
  subtitle,
  children,
  width = "xl",
  className,
  actions,
  hideHeader = false,
}: AppPageProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full flex-1 px-4 py-6 md:px-6 lg:py-8",
        getAppPageWidthClass(width),
        className
      )}
    >
      {!hideHeader && (
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {actions}
        </header>
      )}
      {children}
    </div>
  );
}

interface AppPageCardProps {
  children: React.ReactNode;
  className?: string;
}

/** Карточка-секция внутри AppPage (форма профиля, блок удаления аккаунта). */
export function AppPageCard({ children, className }: AppPageCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm md:p-6",
        className
      )}
    >
      {children}
    </section>
  );
}

export type { AppPageWidth };
