"use client";

import { useActionState } from "react";
import { loginAction, type AuthActionState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandLogo } from "@/components/shared/brand-logo";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
      <Card className="w-full max-w-md border-border/80 shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto">
            <BrandLogo size={96} priority />
          </div>
          <CardTitle className="text-2xl text-primary">SR TECH SOLUTIONS</CardTitle>
          <CardDescription>
            All Types Printer Repair &amp; Support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Mobile</Label>
              <Input
                id="identifier"
                name="identifier"
                placeholder="admin@srtechsolutions.com"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary"
                onClick={() =>
                  alert(
                    "Password reset will be available in a future update. Contact your administrator.",
                  )
                }
              >
                Forgot password?
              </button>
            </div>
            {state.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in..." : "Login"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Development login: admin@srtechsolutions.com / ChangeMe123!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
