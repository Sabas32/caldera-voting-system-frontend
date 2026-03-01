"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import type { AuthUser } from "@/lib/auth";
import { clearCurrentUserCache, setCurrentUserCache } from "@/lib/auth";
import { endpoints } from "@/lib/endpoints";
import { systemLoginSchema } from "@/lib/zodSchemas";

type LoginValues = z.infer<typeof systemLoginSchema>;
type LoginResponse = {
  data: AuthUser;
};

export function SystemLoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<LoginValues>({
    resolver: zodResolver(systemLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => apiClient<LoginResponse>(endpoints.auth.login, { method: "POST", body: JSON.stringify(values) }),
    onSuccess: (response) => {
      setCurrentUserCache(queryClient, response.data);
      if (response.data.is_system_admin) {
        toast.success("Welcome back");
        router.push("/system/dashboard");
        return;
      }

      const hasOrgAccess = response.data.memberships.some((membership) => membership.is_active);
      if (hasOrgAccess) {
        toast.info("This account is not a system admin. Redirecting to organization dashboard.");
        router.push("/org/dashboard");
        return;
      }

      apiClient(endpoints.auth.logout, { method: "POST" }).finally(() => {
        clearCurrentUserCache(queryClient);
        toast.error("This account has no system access.");
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <div className="space-y-2">
        <label className="small">Email</label>
        <Input type="email" {...form.register("email")} />
        {form.formState.errors.email ? <p className="small text-[var(--danger)]">{form.formState.errors.email.message}</p> : null}
      </div>
      <div className="space-y-2">
        <label className="small">Password</label>
        <Input type="password" {...form.register("password")} />
        {form.formState.errors.password ? <p className="small text-[var(--danger)]">{form.formState.errors.password.message}</p> : null}
      </div>
      <Button className="w-full" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
