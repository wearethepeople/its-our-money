import { Slider } from "@base-ui/react/slider";
import { useInputControl } from "@conform-to/react";

type ConformSliderProps = {
  meta: any; // field metadata for categoryField.weight
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel: string;
};

export function ConformSlider({
  meta,
  value,
  onValueChange,
  min = 0,
  max = 1000,
  step = 5,
  ariaLabel,
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
          <Slider.Track className="bg-muted h-2 w-full rounded shadow-[inset_0_0_0_1px] select-none">
            <Slider.Indicator className="rounded select-none" />
            <Slider.Thumb
              aria-label={ariaLabel}
              className="bg-primary size-4 rounded-full outline outline-gray-300 select-none has-focus-visible:outline has-focus-visible:outline-blue-800"
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </>
  );
}
