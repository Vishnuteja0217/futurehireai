import { SignUp } from "@clerk/nextjs";

// Sign-up page at /sign-up
// Mirrors the sign-in page but with Clerk's SignUp component.
export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <SignUp />
    </div>
  );
}