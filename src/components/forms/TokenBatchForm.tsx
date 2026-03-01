import { SimpleForm } from "@/components/forms/SimpleForm";

export function TokenBatchForm() {
  return (
    <SimpleForm
      submitLabel="Generate batch"
      fields={[
        { name: "label", label: "Batch label" },
        { name: "quantity", label: "Quantity", type: "number" },
        { name: "expires_at", label: "Expires at", type: "datetime-local" },
      ]}
    />
  );
}
