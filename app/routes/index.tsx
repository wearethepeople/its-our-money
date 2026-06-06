import { buttonVariants } from "#app/components/ui/button.tsx";
import { TypographyLead } from "#app/components/ui/typography.tsx";
import { cn } from "#app/utils/misc.tsx";
import { href } from "react-router";

export default function IndexRoute() {
  return (
    <div className="flex h-full grow flex-col items-start justify-center gap-8 my-20">
      <TypographyLead>
        <span className="font-bold">Money is personal.</span>
        <br />
        You trade your time for it.
      </TypographyLead>
      <TypographyLead>
        <span className="font-bold">A budget isn’t just numbers.</span>
        <br />
        It’s a ledger of values.
      </TypographyLead>
      <TypographyLead>
        <span className="font-bold">Uncle Sam collects your money all year.</span>
        <br />
        You’ve never been asked where it should go.
      </TypographyLead>
      <TypographyLead>
        If you could decide… what would <em>you</em> choose?
      </TypographyLead>
      <a
        href={href("/bridge")}
        className={cn(buttonVariants({ variant: "default", size: "lg" }), "no-underline py-5 px-6")}
      >
        Begin
      </a>
    </div>
  );
}
