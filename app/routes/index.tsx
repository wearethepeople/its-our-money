import { buttonVariants } from "#app/components/ui/button.tsx";
import { TypographyLead } from "#app/components/ui/typography.tsx";
import { cn } from "#app/utils/misc.tsx";
import { href } from "react-router";

export default function IndexRoute() {
  return (
    <div className="flex h-full grow flex-col items-start justify-center gap-8">
      <TypographyLead>
        <span className="font-bold text-ink-2">Money is personal.</span>
        <br />
        <span className="text-you-ok-soft">You trade your time for it.</span>
      </TypographyLead>
      <TypographyLead>
        <span className="font-bold text-ink-2">An effective budget isn’t just numbers.</span>
        <br />
        <span className="text-you-ok-soft">It’s a ledger of values.</span>
      </TypographyLead>
      <TypographyLead>
        <span className="font-bold text-ink-2">You pay in with every paycheck.</span>
        <br />
        <span className="text-you-ok-soft">
          If you could decide… what would <em>you</em> choose?
        </span>
      </TypographyLead>
      <a
        href={href("/priorities/:year", { year: "2026" })}
        className={cn(
          buttonVariants({ variant: "default", size: "lg" }),
          "no-underline py-5 px-6 bg-line border border-ink-faint text-ink-faint",
        )}
      >
        Begin
      </a>
    </div>
  );
}
