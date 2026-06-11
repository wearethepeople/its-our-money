import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyP,
} from "#app/components/ui/typography.tsx";

export default function HelpRoute() {
  return (
    <div>
      <TypographyH1 className="mb-3">Help</TypographyH1>
      <TypographyLead>Have a question about how It's Our Money works?</TypographyLead>
      <TypographyH2 className="mt-8">Government data</TypographyH2>
      <TypographyP>
        Federal spending data comes from the Office of Management and Budget (OMB) Historical
        Tables, which are publicly available and updated annually. Current-year figures are
        estimates because final actuals typically don't appear until the following budget cycle,
        roughly one to two years after the fact. Separately, the Government Accountability Office
        (GAO) audits the Treasury-prepared consolidated financial statements and has consistently
        found material weaknesses, a useful reminder that federal financial data, across the board,
        carries inherent imprecision.
      </TypographyP>
      <TypographyH2 className="mt-8">The priority sliders</TypographyH2>
      <TypographyP>
        On the priorities page, you're not dividing up a budget. You're expressing priorities, ie.
        how much you value each broad area of federal spending relative to your own sense of what
        matters. Each slider is independent. Moving one doesn't affect the others.
      </TypographyP>
      <TypographyP>
        The five spending areas, Defense & Veterans, Economy & Development, Infrastructure &
        Environment, People & Society, and Science & Government, are It's Our Money's own groupings,
        not official government categories. They're an editorial aggregation of OMB function codes,
        designed to map onto how most people already think and talk about government spending,
        without requiring expertise in federal accounting.
      </TypographyP>
      <TypographyH2 className="mt-8">The comparison</TypographyH2>
      <TypographyP>
        Your priorities and the government's spending don't share a unit of measurement, so the
        comparison screen normalizes both to the same scale before showing them side by side. The
        initial view expresses both as relative priorities — your slider positions and the
        government's spending distribution each translated into a comparable ranking.
      </TypographyP>
      <TypographyP>
        If you move to the percentage comparison tab, you'll see both expressed as shares of total
        spending. Your priorities have been converted proportionally: a slider set high contributes
        a larger share, one set low contributes less. The tab includes a breakdown of how that
        conversion works.
      </TypographyP>
      <TypographyP>
        The tax breakdown tab uses the same converted percentages to show what your allocation would
        mean in dollar terms, based on estimated federal tax contribution figures.
      </TypographyP>
      <TypographyH2 className="mt-8">What this tool isn't</TypographyH2>
      <TypographyP>
        It's Our Money isn't a policy simulator. It doesn't model what would happen to specific
        programs if spending changed. It doesn't account for the distinctions between mandatory
        spending, discretionary spending, and net interest, or the difference between what Congress
        appropriates and what gets spent. The five spending categories are broad by design. More
        detail is available in the primary sources linked below.
      </TypographyP>
      <TypographyH2 className="mt-8">Primary sources</TypographyH2>
      <ul>
        <li>
          <a href="https://www.govinfo.gov/app/collection/budget" target="_blank">
            OMB Historical Tables
          </a>
        </li>
        <li>OMB Circular A-11 Exhibit 79A (function code reference)</li>
        <li>GAO Consolidated Financial Audit Reports</li>
      </ul>
    </div>
  );
}
