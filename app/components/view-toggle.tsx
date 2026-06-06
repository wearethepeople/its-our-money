import { LayoutGrid, List } from "lucide-react";

import { Button } from "#app/components/ui/button.tsx";
import { ButtonGroup } from "#app/components/ui/button-group.tsx";
import { type ViewSchemeId } from "@/constants/grouping-schemes.ts";

export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewSchemeId;
  onChange: (id: ViewSchemeId) => void;
}) {
  return (
    <ButtonGroup>
      <Button
        size="icon-sm"
        variant={value === "public_domain" ? "default" : "outline"}
        aria-label="Grouped view"
        aria-pressed={value === "public_domain"}
        onClick={() => onChange("public_domain")}
      >
        <LayoutGrid />
      </Button>
      <Button
        size="icon-sm"
        variant={value === "flat" ? "default" : "outline"}
        aria-label="List view"
        aria-pressed={value === "flat"}
        onClick={() => onChange("flat")}
      >
        <List />
      </Button>
    </ButtonGroup>
  );
}
