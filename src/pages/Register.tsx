import { useState } from "react";
import {
    createUserWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";

import { auth } from "../firebase/auth";
import { useNavigate } from "react-router-dom";


type RegistrationRole =
    | "hcp"
    | "pharma"
    | "team_member";


export default function Register() {

    const navigate = useNavigate();


    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [role, setRole] =
        useState<RegistrationRole>("hcp");

    const [passcode, setPasscode] =
        useState("");


    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    const requiresPasscode =
        role === "hcp" ||
        role === "pharma";


    async function handleRegister(
        e: React.FormEvent<HTMLFormElement>
    ) {

        e.preventDefault();

        setError("");


        if (!name.trim()) {

            setError(
                "Please enter your name."
            );

            return;
        }


        if (password !== confirmPassword) {

            setError(
                "Passwords do not match."
            );

            return;
        }


        if (password.length < 6) {

            setError(
                "Password must be at least 6 characters."
            );

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


        setLoading(true);


        try {

            /*
             * HCP and Pharma accounts must first
             * be verified by the Python API.
             *
             * Team members skip this step.
             */
            if (requiresPasscode) {

                const response =
                    await fetch(
                        "http://localhost:8000/auth/verify-registration",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                name:
                                    name.trim(),

                                email:
                                    email.trim()
                                        .toLowerCase(),

                                role,

                                passcode:
                                    passcode.trim(),
                            }),
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    setError(
                        data.detail ||
                        "Your email or passcode could not be verified."
                    );

                    return;
                }
            }


            /*
             * Create Firebase account.
             *
             * NOTE:
             * For the MVP this is fine after the
             * Python verification step.
             */
            const credential =
                await createUserWithEmailAndPassword(
                    auth,
                    email.trim(),
                    password
                );


            await updateProfile(
                credential.user,
                {
                    displayName:
                        name.trim(),
                }
            );


            /*
             * Create the user's application
             * profile in Firestore.
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
                            uid:
                                credential.user.uid,

                            name:
                                name.trim(),

                            email:
                                email.trim()
                                    .toLowerCase(),

                            role,
                        }),
                    }
                );


            if (!profileResponse.ok) {

                console.error(
                    "Failed to create user profile."
                );
            }


            navigate("/");

        } catch (err: any) {

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

        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

            <div className="w-full max-w-md">

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

                    <div className="mb-8 text-center">

                        <h1 className="text-3xl font-bold text-gray-900">
                            Create an account
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Get started with your account
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
                                    setName(
                                        e.target.value
                                    )
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
                                    setEmail(
                                        e.target.value
                                    )
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

                                <option value="team_member">
                                    Team Member
                                </option>

                            </select>

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
                                        setPasscode(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter your passcode"
                                    autoComplete="off"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                <p className="mt-2 text-xs text-gray-500">
                                    Your email and passcode must
                                    be approved before creating
                                    this account.
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
                                    setPassword(
                                        e.target.value
                                    )
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
                                    setConfirmPassword(
                                        e.target.value
                                    )
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