"use client";

import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

type SelectProps = {
  id?: string;
  value?: string | number;
  defaultValue?: string | number;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  uiSize?: "sm" | "md";
};

type SelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

const sizeMap = {
  sm: "h-8 text-sm",
  md: "h-10 text-sm",
};

function parseOptions(children: React.ReactNode): SelectOption[] {
  return React.Children.toArray(children)
    .filter(React.isValidElement)
    .map((node) => {
      const option = node as React.ReactElement<{ value?: string; children?: React.ReactNode; disabled?: boolean }>;
      const rawValue = option.props.value;
      return {
        value: rawValue === undefined || rawValue === null ? "" : String(rawValue),
        label: option.props.children ?? (rawValue === undefined || rawValue === null ? "" : String(rawValue)),
        disabled: option.props.disabled ?? false,
      };
    })
    .filter((option) => option.value !== "");
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ className, uiSize = "md", value, defaultValue, onChange, children, disabled, id }, ref) => {
    const options = React.useMemo(() => parseOptions(children), [children]);
    const selectedValue =
      value === undefined || value === null
        ? undefined
        : String(value);
    const selectedLabelValue =
      selectedValue ??
      (defaultValue === undefined || defaultValue === null ? undefined : String(defaultValue));
    const selectedOption = options.find((option) => option.value === selectedValue);

    const handleValueChange = (nextValue: string) => {
      onChange?.({ target: { value: nextValue } } as unknown as React.ChangeEvent<HTMLSelectElement>);
    };

    return (
      <RadixSelect.Root
        value={selectedValue}
        defaultValue={defaultValue === undefined || defaultValue === null ? undefined : String(defaultValue)}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          ref={ref}
          id={id}
          className={cn(
            "relative w-full rounded-[11px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_78%,var(--surface-2))] px-3 pr-9 text-left text-[var(--text)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--surface)_82%,transparent)] outline-none transition-all duration-200 hover:border-[color-mix(in_oklab,var(--border)_55%,var(--primary))] focus-visible:border-[color-mix(in_oklab,var(--primary)_70%,var(--border))] focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60",
            sizeMap[uiSize],
            className,
          )}
        >
          <RadixSelect.Value>{selectedOption?.label ?? selectedLabelValue ?? ""}</RadixSelect.Value>
          <RadixSelect.Icon asChild>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-text)]" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={8}
            className="z-50 overflow-hidden rounded-[14px] border border-[var(--edge)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface)_92%,transparent),color-mix(in_oklab,var(--surface)_74%,var(--surface-2)))] shadow-[0_20px_42px_var(--shadow)]"
          >
            <RadixSelect.ScrollUpButton className="flex h-7 cursor-default items-center justify-center text-[var(--muted-text)]">
              <ChevronUp className="size-4" />
            </RadixSelect.ScrollUpButton>

            <RadixSelect.Viewport className="max-h-72 min-w-[var(--radix-select-trigger-width)] p-1.5">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="relative flex cursor-pointer select-none items-center rounded-[10px] px-8 py-2 text-sm text-[var(--text)] outline-none transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 data-[highlighted]:bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] data-[state=checked]:bg-[color-mix(in_oklab,var(--primary)_20%,var(--surface))]"
                >
                  <RadixSelect.ItemIndicator className="absolute left-2 inline-flex items-center justify-center text-[var(--primary-700)]">
                    <Check className="size-4" />
                  </RadixSelect.ItemIndicator>
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>

            <RadixSelect.ScrollDownButton className="flex h-7 cursor-default items-center justify-center text-[var(--muted-text)]">
              <ChevronDown className="size-4" />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    );
  },
);

Select.displayName = "Select";
