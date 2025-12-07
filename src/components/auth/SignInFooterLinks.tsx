interface SignInFooterLinksProps {
  supportEmail: string;
  returnTo?: string;
}

export function SignInFooterLinks({ supportEmail, returnTo }: SignInFooterLinksProps) {
  const signUpUrl = returnTo ? `/signup?returnTo=${encodeURIComponent(returnTo)}` : "/signup";

  return (
    <div className="text-center space-y-2">
      <p className="text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <a href={signUpUrl} className="underline underline-offset-4 hover:text-primary transition-colors font-medium">
          Zarejestruj się
        </a>
      </p>
      <p className="text-sm text-muted-foreground">
        <a href="/auth/reset" className="underline underline-offset-4 hover:text-primary transition-colors">
          Nie pamiętasz hasła?
        </a>
      </p>
      <p className="text-sm text-muted-foreground">
        Potrzebujesz pomocy?{" "}
        <a
          href={`mailto:${supportEmail}`}
          className="underline underline-offset-4 hover:text-primary transition-colors"
        >
          Skontaktuj się z nami
        </a>
      </p>
      <p className="text-xs text-muted-foreground mt-4">Sesja wygasa po 24 godzinach nieaktywności</p>
    </div>
  );
}
