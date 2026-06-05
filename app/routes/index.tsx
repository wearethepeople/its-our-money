import { TypographyLead } from "#app/components/ui/typography.tsx";
import { href } from "react-router";

export default function IndexRoute() {
  return (
    <div className="flex h-full grow flex-col items-start justify-center gap-8 my-20">
      <TypographyLead>
        Money is personal.
        <br />
        You trade your time for it.
      </TypographyLead>
      <TypographyLead>
        A budget isn’t just numbers.
        <br />
        It’s a ledger of values.
      </TypographyLead>
      <TypographyLead>
        Uncle Sam collects your money all year.
        <br />
        You’ve never been asked where it should go.
      </TypographyLead>
      <TypographyLead>
        If you could decide… what would <em>you</em> choose?
      </TypographyLead>
      <a href={href("/bridge")}>Begin</a>
    </div>
  );
}
