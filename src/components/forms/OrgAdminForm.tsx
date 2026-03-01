import { SimpleForm } from "@/components/forms/SimpleForm";

export function OrgAdminForm() {
  return (
    <SimpleForm
      submitLabel="Save org admin"
      fields={[
        { name: "email", label: "Email", type: "email" },
        { name: "first_name", label: "First name" },
        { name: "last_name", label: "Last name" },
        { name: "role", label: "Role", placeholder: "ORG_ADMIN" },
      ]}
    />
  );
}
