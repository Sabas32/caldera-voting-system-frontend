import { SimpleForm } from "@/components/forms/SimpleForm";

export function ElectionForm() {
  return (
    <SimpleForm
      submitLabel="Save election"
      fields={[
        { name: "title", label: "Election title" },
        { name: "slug", label: "Slug" },
        { name: "opens_at", label: "Opens at", type: "datetime-local" },
        { name: "closes_at", label: "Closes at", type: "datetime-local" },
      ]}
    />
  );
}
