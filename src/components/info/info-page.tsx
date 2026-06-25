import { cn } from "@/lib/utils";

interface InfoPageProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function InfoPage({
  title,
  subtitle,
  children,
  footer,
  className,
}: InfoPageProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-2xl flex-1 px-4 py-10 md:px-6 md:py-12",
        className
      )}
    >
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">{subtitle}</p>
      </header>

      <div className="space-y-8">{children}</div>

      {footer ? (
        <footer className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}

interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
}

export function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

interface InfoStepsProps {
  steps: Array<{ title: string; text: string }>;
}

export function InfoSteps({ steps }: InfoStepsProps) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-4">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand"
            aria-hidden
          >
            {index + 1}
          </span>
          <div className="min-w-0 space-y-1 pt-0.5">
            <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {step.text}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

interface InfoFaqProps {
  items: Array<{ question: string; answer: string }>;
}

export function InfoFaq({ items }: InfoFaqProps) {
  return (
    <dl className="divide-y divide-border rounded-xl border border-border bg-card">
      {items.map((item) => (
        <div key={item.question} className="space-y-1 px-4 py-4 md:px-5">
          <dt className="text-sm font-semibold text-foreground">{item.question}</dt>
          <dd className="text-sm leading-relaxed text-muted-foreground">
            {item.answer}
          </dd>
        </div>
      ))}
    </dl>
  );
}
