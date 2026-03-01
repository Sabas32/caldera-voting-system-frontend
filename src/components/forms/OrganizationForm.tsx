import { SimpleForm } from "@/components/forms/SimpleForm";

export function OrganizationForm() {
  return (
    <SimpleForm
      submitLabel="Create organization"
      fields={[
        { name: "name", label: "Organization name" },
        { name: "slug", label: "Slug" },
        { name: "primary_color_override", label: "Primary color override", placeholder: "#F5C84B" },
        { name: "logo_url", label: "Logo URL", type: "url" },
      ]}
    />
  );
}
