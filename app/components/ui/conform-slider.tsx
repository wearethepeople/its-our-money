import { Slider } from "@base-ui/react/slider";
import { useInputControl } from "@conform-to/react";

import { MAX_ALLOCATION_WEIGHT } from "@/constants/index.ts";

// Track gradient stops expressed in oklch (L: 0–1, C: 0–0.4, H inherited from color var).
// Light end is interpolated 75% of the way toward the dark end to reduce contrast.
const DARK_L = 0.38;
const DARK_C = 0.12;
const LIGHT_L = 0.88 - 0.5 * (0.88 - DARK_L); // 0.505
const LIGHT_C = 0.04 + 0.5 * (DARK_C - 0.04); // 0.10
// Empty (right-of-thumb) track: a step darker than --color-surface-2, adaptive to light/dark.
const EMPTY_TRACK_BG = "oklch(from var(--surface-2) calc(l - 0.06) c h)";

type ConformSliderProps = {
  meta: any; // field metadata for categoryField.weight
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel: string;
  trackColorVar?: string;
};

export function ConformSlider({
  meta,
  value,
  onValueChange,
  min = 1,
  max = MAX_ALLOCATION_WEIGHT,
  step = 1,
  ariaLabel,
  trackColorVar,
}: ConformSliderProps) {
  const control = useInputControl(meta);

  return (
    <>
      <input
        key={meta.key}
        type="hidden"
        name={meta.name}
        form={meta.formId}
        value={String(value)}
        onChange={() => {}}
      />

      <Slider.Root<number>
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : min}
        onValueChange={(nextValue) => {
          onValueChange(nextValue);
          control.change(String(nextValue));
        }}
        onValueCommitted={() => {
          // marks "touched" semantics in a way Conform understands
          control.blur();
        }}
      >
        <Slider.Control className="flex w-auto touch-none items-center py-2 select-none">
          <Slider.Track
            className="h-2 w-full rounded select-none"
            style={{ background: EMPTY_TRACK_BG }}
          >
            <Slider.Indicator
              className="rounded select-none"
              style={(() => {
                if (!trackColorVar) return undefined;
                const pct = (value - min) / (max - min);
                return {
                  background: `linear-gradient(to right, oklch(from var(${trackColorVar}) ${LIGHT_L} ${LIGHT_C} h), oklch(from var(${trackColorVar}) ${DARK_L} ${DARK_C} h))`,
                  backgroundSize: `${pct > 0 ? (1 / pct) * 100 : 10000}% 100%`,
                  backgroundRepeat: "no-repeat",
                };
              })()}
            />
            <Slider.Thumb
              aria-label={ariaLabel}
              className="size-3.5 rounded-full select-none shadow-sm has-focus-visible:outline has-focus-visible:outline-blue-800"
              style={{
                background: trackColorVar
                  ? `oklch(from var(${trackColorVar}) 0.6 0.08 h)`
                  : "var(--color-ink-muted)",
                boxShadow: `0 0 0 2px ${EMPTY_TRACK_BG}`,
              }}
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </>
  );
}
