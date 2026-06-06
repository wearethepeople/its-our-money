import { href } from "react-router";
import { TypographyLead } from "#app/components/ui/typography.tsx";
import { cn } from "#app/utils/misc.tsx";
import { buttonVariants } from "#app/components/ui/button.tsx";

export default function BridgeRoute() {
  return (
    <div className="flex h-full grow flex-col items-start justify-center gap-8 my-20">
      <TypographyLead>
        <span className="font-bold">
          The federal budget divides money across priorities like defense, healthcare, and
          education.
        </span>
        <br />
        You don’t have to be an expert to have an opinion on what matters.
      </TypographyLead>
      <TypographyLead>
        <span className="font-bold">Some spending is fixed, like your bills.</span>
        <br />
        <span className="font-normal">Some is flexible.</span>
      </TypographyLead>
      <TypographyLead>
        <span className="font-bold">This isn’t about drafting a federal budget.</span>
        <br />
        It’s about what you would prioritize if{" "}
        <em>
          <strong>you</strong>
        </em>{" "}
        had a say.
      </TypographyLead>
      <a
        href={href("/allocate/:year", { year: "2026" })}
        className={cn(buttonVariants({ variant: "default", size: "lg" }), "no-underline py-5 px-6")}
      >
        Continue
      </a>
    </div>
  );
}
