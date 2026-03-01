import { SimpleForm } from "@/components/forms/SimpleForm";

export function PostForm() {
  return (
    <SimpleForm
      submitLabel="Save post"
      fields={[
        { name: "title", label: "Post title" },
        { name: "max_selections", label: "Max selections", type: "number" },
        { name: "sort_order", label: "Sort order", type: "number" },
      ]}
    />
  );
}
