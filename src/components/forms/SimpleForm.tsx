"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Field = { name: string; label: string; type?: string; placeholder?: string };

export function SimpleForm({
  fields,
  submitLabel,
}: {
  fields: Field[];
  submitLabel: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        toast.success(`${submitLabel} queued`);
      }}
    >
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <label className="small">{field.label}</label>
          <Input
            type={field.type ?? "text"}
            placeholder={field.placeholder}
            value={values[field.name] ?? ""}
            onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
          />
        </div>
      ))}
      <Button type="submit" className="w-fit">
        {submitLabel}
      </Button>
    </form>
  );
}
