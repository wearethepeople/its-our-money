import { href } from "react-router";
import { TypographyLead } from "#app/components/ui/typography.tsx";
import { cn } from "#app/utils/misc.tsx";
import { buttonVariants } from "#app/components/ui/button.tsx";

export default function BridgeRoute() {
  return (
    <div className="flex h-full grow flex-col items-start justify-center gap-8 my-20">
      <TypographyLead>
        <span className="font-bold text-ink-2">
          The federal budget divides money across priorities like defense, healthcare, and
          education.
        </span>
        <br />
        <span className="text-you-ok-soft">
          You don’t have to be an expert to have an opinion on what matters.
        </span>
      </TypographyLead>
      <TypographyLead>
        <span className="font-bold text-ink-2">Some spending is fixed, like your bills.</span>
        <br />
        <span className="text-you-ok-soft">Some is flexible.</span>
      </TypographyLead>
      <TypographyLead>
        <span className="font-bold text-ink-2">This isn’t about drafting a federal budget.</span>
        <br />
        <span className="text-you-ok-soft">
          It’s about what you would prioritize if{" "}
          <em>
            <strong>you</strong>
          </em>{" "}
          had a say.
        </span>
      </TypographyLead>
      <a
        href={href("/allocate/:year", { year: "2026" })}
        className={cn(
          buttonVariants({ variant: "default", size: "lg" }),
          "no-underline py-5 px- bg-line border border-ink-faint text-ink-faint",
        )}
      >
        Continue
      </a>
    </div>
  );
}
