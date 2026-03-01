import { SimpleForm } from "@/components/forms/SimpleForm";

export function CandidateForm() {
  return (
    <SimpleForm
      submitLabel="Save candidate"
      fields={[
        { name: "name", label: "Candidate name" },
        { name: "description", label: "Description" },
      ]}
    />
  );
}
