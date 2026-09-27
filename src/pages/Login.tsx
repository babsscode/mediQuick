import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Firebase has successfully logged the user in.
      // Your auth state listener/router can handle redirecting them.
    } catch (err: any) {
      switch (err.code) {
        case "auth/invalid-credential":
          setError("Incorrect email or password.");
          break;

        case "auth/user-not-found":
          setError("No account exists with this email.");
          break;

        case "auth/wrong-password":
          setError("Incorrect password.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/too-many-requests":
          setError("Too many attempts. Please try again later.");
          break;

        default:
          setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#B7D8D6] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#789E9E] bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="m-0 text-[24px] font-semibold tracking-tight text-[#4D6466]">
              Welcome back
            </h1>

            <p className="mt-2 text-[#789E9E]">
              Sign in to your account
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-[#FE615A] bg-white px-4 py-3 text-sm text-[#FE615A]">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#4D6466]"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-[#789E9E] bg-[#EEF3D8] px-4 py-3 text-[#4D6466] outline-none transition focus:border-[#FE615A] focus:bg-white focus:ring-2 focus:ring-[#FE615A]"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#4D6466]"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-sm text-[#FE615A] hover:text-[#4D6466]"
                  onClick={() => {
                    // Add password reset functionality here.
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-[#789E9E] bg-[#EEF3D8] px-4 py-3 text-[#4D6466] outline-none transition focus:border-[#FE615A] focus:bg-white focus:ring-2 focus:ring-[#FE615A]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#4D6466] px-4 py-3 font-medium text-[#EEF3D8] transition hover:bg-[#789E9E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#789E9E]">
            Don't have an account?{" "}
            <a
              href="/register"
              className="font-medium text-[#FE615A] hover:text-[#4D6466]"
            >
              Create one
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}