import { TypographyP } from "#app/components/ui/typography.tsx";

export function WeightsRoundingNote() {
  return (
    <TypographyP className="my-6 text-sm">
      A note:&nbsp;
      <span className="text-ink-faint">
        Washington's smallest priorities are rounded up to the lowest spot on the scale, so very
        small priorities may look slightly larger than they really are in this projection.
      </span>
    </TypographyP>
  );
}

export function PercentsRoundingNote() {
  return (
    <TypographyP className="my-6 text-sm">
      A note:&nbsp;
      <span className="text-ink-faint">
        The badge on the right is the difference: where you'd spend more than Washington, and where
        you'd spend less.
      </span>
    </TypographyP>
  );
}
