interface SignUpFooterLinksProps {
  supportEmail: string;
  returnTo?: string;
}

/**
 * Footer links for sign up page
 *
 * Displays:
 * - Link to sign in page ("Masz już konto?")
 * - Support contact link
 */
export function SignUpFooterLinks({ supportEmail, returnTo }: SignUpFooterLinksProps) {
  const signInUrl = returnTo ? `/signin?returnTo=${encodeURIComponent(returnTo)}` : "/signin";

  return (
    <div className="text-center space-y-2">
      <p className="text-sm text-muted-foreground">
        Masz już konto?{" "}
        <a href={signInUrl} className="underline underline-offset-4 hover:text-primary transition-colors font-medium">
          Zaloguj się
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
    </div>
  );
}
