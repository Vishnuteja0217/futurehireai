import { SignIn } from "@clerk/nextjs";

// Sign-in page at /sign-in
// Uses Clerk's pre-built SignIn component — handles email/password,
// Google sign-in, password reset, error states, all of it.
export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <SignIn />
    </div>
  );
}