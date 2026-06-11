import { TypographyP } from "#app/components/ui/typography.tsx";

export function AllocationRoundingNote() {
  return (
    <TypographyP className="my-6 text-sm text-ink-faint">
      Note: Washington's smallest priorities are rounded up to the lowest spot on the scale,
      so very small allocations may look slightly larger here than they really are.
    </TypographyP>
  );
}
