import { Suspense } from "react";
import LoginForm from "./login-form";

export default function AccountLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
