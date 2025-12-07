import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { signUpFormSchema } from "@/lib/auth/validation";
import { useSignUp } from "@/lib/auth/useSignUp";
import { useAuthRedirect } from "@/lib/auth/useAuthRedirect";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import type { Database } from "@/db/database.types";
import type { SignUpFormValues, SignUpSuccessPayload, AuthErrorState } from "@/lib/auth/types";

interface SignUpFormProps {
  returnTo?: string;
  onSuccess: (result: SignUpSuccessPayload) => void;
  onError: (error: AuthErrorState) => void;
  supabaseUrl: string;
  supabaseKey: string;
}

/**
 * Sign up form with validation and password strength indicator
 *
 * Features:
 * - Company name, email, password, and confirm password fields
 * - Real-time validation with Zod
 * - Password visibility toggle
 * - Password strength indicator
 * - ARIA accessibility attributes
 * - Loading states
 */
export function SignUpForm({ returnTo, onSuccess, onError, supabaseUrl, supabaseKey }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Sign up mutation
  const { signUp, isLoading } = useSignUp({
    supabase,
    returnTo,
    onSuccess,
    onError,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    mode: "onBlur",
  });

  const watchPassword = watch("password", "");

  const onSubmit = (data: SignUpFormValues) => {
    signUp(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Company Name Field */}
      <div className="space-y-2">
        <Label htmlFor="companyName">
          Nazwa firmy <span className="text-destructive">*</span>
        </Label>
        <Input
          id="companyName"
          type="text"
          autoComplete="organization"
          placeholder="Twoja Firma Sp. z o.o."
          disabled={isLoading}
          aria-invalid={!!errors.companyName}
          aria-describedby={errors.companyName ? "companyName-error" : undefined}
          {...register("companyName")}
        />
        {errors.companyName && (
          <p id="companyName-error" className="text-sm text-destructive" role="alert">
            {errors.companyName.message}
          </p>
        )}
      </div>

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
            autoComplete="new-password"
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
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordStrengthIndicator password={watchPassword} />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          Potwierdź hasło <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={isLoading}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
            aria-label={showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Tworzenie konta...
          </>
        ) : (
          "Utwórz konto"
        )}
      </Button>

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isLoading && "Trwa tworzenie konta..."}
      </div>
    </form>
  );
}
