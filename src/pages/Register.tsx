import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import { auth } from "../firebase/auth";
import { useNavigate } from "react-router-dom";

type RegistrationRole =
  | "hcp"
  | "pharma";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [role, setRole] =
    useState<RegistrationRole>("hcp");

  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [about, setAbout] = useState("");

  const [passcode, setPasscode] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requiresPasscode =
    role === "hcp" ||
    role === "pharma";

  const requiresSpecialty =
    role === "hcp";

  async function handleRegister(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanLocation = location.trim();
    const cleanSpecialty = specialty.trim();
    const cleanAbout = about.trim();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }

    if (!cleanLocation) {
      setError("Please enter your location.");
      return;
    }

    if (
      requiresSpecialty &&
      !cleanSpecialty
    ) {
      setError("Please enter your specialty.");
      return;
    }

    if (
      requiresPasscode &&
      !passcode.trim()
    ) {
      setError(
        "Please enter your verification passcode."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * Verify HCP / Pharma credentials
       * with the Python API before creating
       * the Firebase account.
       */
      if (requiresPasscode) {
        const response = await fetch(
          "http://localhost:8000/auth/verify-registration",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: cleanName,
              email: cleanEmail,
              role,
              passcode: passcode.trim(),
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.detail ||
              "Your email or passcode could not be verified."
          );

          return;
        }
      }

      /*
       * Create Firebase Authentication account.
       */
      const credential =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      /*
       * Store the user's display name
       * in Firebase Authentication.
       */
      await updateProfile(
        credential.user,
        {
          displayName: cleanName,
        }
      );

      /*
       * Create the application profile
       * through the Python backend.
       */
      const profileResponse =
        await fetch(
          "http://localhost:8000/auth/create-profile",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              uid: credential.user.uid,

              name: cleanName,

              email: cleanEmail,

              role,

              location:
                cleanLocation,

              specialty:
                cleanSpecialty || null,

              about:
                cleanAbout || null,
            }),
          }
        );

      if (!profileResponse.ok) {
        console.error(
          "Failed to create user profile."
        );

        /*
         * The Firebase account was created,
         * but the application profile failed.
         */
        setError(
          "Your account was created, but we could not finish setting up your profile. Please contact support."
        );

        return;
      }

      navigate("/");

    } catch (err: any) {
      console.error(err);

      switch (err.code) {
        case "auth/email-already-in-use":
          setError(
            "An account already exists with this email."
          );
          break;

        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        case "auth/weak-password":
          setError(
            "Your password is too weak."
          );
          break;

        default:
          setError(
            "Something went wrong. Please try again."
          );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          <div className="mb-8 text-center">

            <h1 className="text-3xl font-bold text-gray-900">
              Create an account
            </h1>

            <p className="mt-2 text-gray-500">
              Create your Impiricus account
            </p>

          </div>


          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}


          <form
            onSubmit={handleRegister}
            className="space-y-5"
          >

            {/* NAME */}

            <div>

              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Your name"
                autoComplete="name"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* EMAIL */}

            <div>

              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* ROLE */}

            <div>

              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Account type
              </label>

              <select
                id="role"
                value={role}
                onChange={(e) =>
                  setRole(
                    e.target.value as RegistrationRole
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >

                <option value="hcp">
                  Healthcare Professional
                </option>

                <option value="pharma">
                  Pharma Representative
                </option>

              </select>

            </div>


            {/* LOCATION */}

            <div>

              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Location
              </label>

              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                placeholder="City, State"
                autoComplete="address-level2"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* SPECIALTY */}

            <div>

              <label
                htmlFor="specialty"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {role === "hcp"
                  ? "Specialty"
                  : "Specialty / Area of focus"}
              </label>

              <input
                id="specialty"
                type="text"
                value={specialty}
                onChange={(e) =>
                  setSpecialty(e.target.value)
                }
                placeholder={
                  role === "hcp"
                    ? "e.g. Cardiology"
                    : "e.g. Oncology"
                }
                required={requiresSpecialty}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* ABOUT */}

            <div>

              <label
                htmlFor="about"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                About
              </label>

              <textarea
                id="about"
                value={about}
                onChange={(e) =>
                  setAbout(e.target.value)
                }
                placeholder={
                  role === "hcp"
                    ? "Tell the community a little about yourself, your practice, or your areas of interest..."
                    : "Tell the community a little about yourself or your area of focus..."
                }
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
              />

              <p className="mt-1 text-xs text-gray-500">
                Optional
              </p>

            </div>


            {/* VERIFICATION PASSCODE */}

            {requiresPasscode && (
              <div>

                <label
                  htmlFor="passcode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Verification passcode
                </label>

                <input
                  id="passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) =>
                    setPasscode(e.target.value)
                  }
                  placeholder="Enter your passcode"
                  autoComplete="off"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Your email and passcode must be
                  approved before creating this account.
                </p>

              </div>
            )}


            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Create a password"
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* CONFIRM PASSWORD */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating account..."
                : "Create account"}
            </button>

          </form>


          <div className="mt-6 text-center text-sm text-gray-500">

            Already have an account?{" "}

            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Sign in
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
