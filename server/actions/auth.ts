"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations";

export type AuthActionState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    remember: formData.get("remember") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  const { identifier, password } = parsed.data;
  const supabase = await createClient();

  // Supabase Auth signs in by email only. If the identifier isn't an email
  // (i.e. it's a phone number), resolve it to the account's email first.
  let email = identifier.trim();
  if (!email.includes("@")) {
    const { data: resolvedEmail } = await supabase.rpc("email_for_identifier", {
      identifier: email,
    });
    if (!resolvedEmail) {
      return { error: "Invalid email/mobile or password" };
    }
    email = resolvedEmail;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });

  if (error || !data.user) {
    return { error: "Invalid email/mobile or password" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(profile?.role === "ADMIN" ? "/admin/dashboard" : "/customer/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
