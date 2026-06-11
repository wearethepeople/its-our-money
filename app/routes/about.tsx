import { TypographyH1, TypographyLead, TypographyP } from "#app/components/ui/typography.tsx";

export default function AboutRoute() {
  return (
    <div>
      <TypographyH1 className="mb-3">About</TypographyH1>
      <TypographyLead>
        Creating clarity around how the federal government spends our money.
      </TypographyLead>
      <TypographyP>
        This isn't an advocacy tool. It doesn't tell you what to think about what you find. It asks
        you to state your own priorities, shows you what the government's spending suggests about
        its priorities, and puts the two next to each other.
      </TypographyP>
      <TypographyP>That's it. What you do with that comparison is entirely yours.</TypographyP>
      <TypographyP>
        It's Our Money is part of We (ARE) the People, a broader project built around the belief
        that civic participation works better when people feel equipped rather than overwhelmed and
        operate on a level without labels or self-sorting.
      </TypographyP>
      <TypographyP>
        Learn more at{" "}
        <a href="https://wearethepeople.us" target="_blank">
          We (ARE) the People
        </a>
        .
      </TypographyP>
    </div>
  );
}
