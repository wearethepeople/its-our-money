import { TypographyH1, TypographyLead, TypographyP } from "#app/components/ui/typography.tsx";

export default function PrivacyRoute() {
  return (
    <div>
      <TypographyH1 className="mb-3">Privacy</TypographyH1>
      <TypographyLead>
        Here's how we <span className="line-through">handle</span> don't store your data.
      </TypographyLead>
      <TypographyP>
        It's Our Money doesn't know who you are. We don't collect your name, email address, IP
        address, or any personally identifying information in the course of using the tool.
      </TypographyP>
      <TypographyP>
        The site doesn't use Google Analytics, Google Fonts, or any other Google products. It
        doesn't run on AWS (we use fly.io). We do not sell, share, or transmit your data to third
        parties because we have none of it in the first place.
      </TypographyP>
      <TypographyP>
        The only cookies it stores are for your desired color scheme and your priorities. No
        tracking cookies. No advertising pixels. No fingerprinting.
      </TypographyP>
      <TypographyP>
        If you publish or share your results using the anonymous share feature, the allocation you
        chose becomes accessible via a public link. No identifying information is attached to it.
      </TypographyP>
      <TypographyP>That's the whole policy.</TypographyP>
    </div>
  );
}
