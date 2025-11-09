import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { signInFormSchema } from "@/lib/auth/validation";
import { useSignIn } from "@/lib/auth/useSignIn";
import { useAuthRedirect } from "@/lib/auth/useAuthRedirect";
import type { Database } from "@/db/database.types";
import type { SignInFormValues, SignInSuccessPayload } from "@/lib/auth/types";

interface SignInFormProps {
  returnTo?: string;
  onSuccess: (result: SignInSuccessPayload) => void;
  onError: (error: import("@/lib/auth/types").AuthErrorState) => void;
  supabaseUrl: string;
  supabaseKey: string;
}

export function SignInForm({ returnTo, onSuccess, onError, supabaseUrl, supabaseKey }: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Create Supabase client with passed credentials
  const supabase = useMemo(() => {
    return createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    });
  }, [supabaseUrl, supabaseKey]);

  // Check if user is already authenticated and redirect if so
  useAuthRedirect(supabase, returnTo);

  // Sign in mutation
  const { signIn, isLoading } = useSignIn({
    supabase,
    returnTo,
    onSuccess: (redirectTo) => {
      onSuccess({ redirectTo });
    },
    onError: (error) => {
      onError(error);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    mode: "onBlur",
  });

  const onSubmit = (data: SignInFormValues) => {
    signIn(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="twoj.email@example.com"
          disabled={isLoading}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">
          Hasło <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isLoading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
            aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logowanie...
          </>
        ) : (
          "Zaloguj się"
        )}
      </Button>

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isLoading && "Trwa logowanie..."}
      </div>
    </form>
  );
}

