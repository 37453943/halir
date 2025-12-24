// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";

export default function LoginPage() {
    const [registerData, setRegisterData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    });

    const [registerMessage, setRegisterMessage] = useState("");
    const [registerMessageType, setRegisterMessageType] = useState<'success' | 'error' | ''>('');
    const [loginMessage, setLoginMessage] = useState("");
    // Redirect away if user is already authenticated (guard the login page)
    useEffect(() => {
        (async () => {
            try {
                const r = await fetch('/api/auth/me', { credentials: 'include' });
                if (!r.ok) return;
                const data = await r.json();
                if (data.user?.role === 'admin') window.location.href = '/admin';
                else window.location.href = '/';
            } catch (e) {
                // ignore errors
            }
        })();
    }, []);
    // ✅ Register handler
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registerData),
            });
            const data = await res.json();
            if (res.ok) {
                // Successful registration: prompt user to log in instead of auto-login
                setRegisterMessage("Account created successfully! Please log in now.");
                setRegisterMessageType('success');
                // Ensure we are not leaving any stray session tokens
                try { sessionStorage.removeItem('token'); sessionStorage.removeItem('role'); } catch (e) { }
            } else {
                setRegisterMessage(data.error || "Registration failed");
                setRegisterMessageType('error');
            }
        } catch (err) {
            setRegisterMessage("Error registering user");
        }
    };

    // ✅ Login handler
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
            });
            const data = await res.json();
            if (res.ok) {
                setLoginMessage("Login successful!");
                // Cookie is set by the server; use role in response to redirect
                if (data.role === 'admin') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/';
                }
            } else {
                setLoginMessage(data.error || "Login failed");
            }
        } catch (err) {
            setLoginMessage("Error logging in");
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-4xl w-full bg-transparent border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-2">
                {/* Create Account */}
                <div className="p-8 border-r border-gray-200">
                    <h2 className="text-2xl font-bold mb-6">CREATE ACCOUNT</h2>
                    <form onSubmit={handleRegister}>
                        <div className="flex bg-white border border-gray-200 p-5 gap-5 items-center ">
                            <label className="text-sm w-32">Full Name</label>
                            <input required className="flex-1 border-none p-0 text-sm" placeholder="Full Name" value={(registerData as any).name} onChange={(e) => { setRegisterData({ ...registerData, name: e.target.value }); setRegisterMessage(''); setRegisterMessageType(''); }} />
                        </div>

                        <div className="flex bg-white border border-gray-200 p-5 gap-5 items-center ">
                            <label className="text-sm w-32">Email</label>
                            <input required type="email" className="flex-1 border-none p-0 text-sm" placeholder="Email Address" value={registerData.email} onChange={(e) => { setRegisterData({ ...registerData, email: e.target.value }); setRegisterMessage(''); setRegisterMessageType(''); }} />
                        </div>

                        <div className="flex bg-white border border-gray-200 p-5 gap-5 items-center mb-6 ">
                            <label className="text-sm w-32">Password</label>
                            <input required type="password" className="flex-1 border-none p-0 text-sm" placeholder="Password" value={(registerData as any).password} onChange={(e) => { setRegisterData({ ...registerData, password: e.target.value }); setRegisterMessage(''); setRegisterMessageType(''); }} />
                        </div>

                        <div>
                            <button className={btn}>CREATE ACCOUNT</button>
                        </div>
                        {registerMessage && (
                            <div className={`mt-2 text-sm ${registerMessageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {registerMessage}
                            </div>
                        )}
                    </form>
                </div>

                {/* Log In */}
                <div className="p-8">
                    <h2 className="text-2xl font-bold mb-6">LOG IN</h2>
                    <form onSubmit={handleLogin}>
                        <div className="flex bg-white border border-gray-200 p-5 gap-5 items-center">
                            <label className="text-sm w-32">Email</label>
                            <input required type="email" className="flex-1 border-none p-0 text-sm" placeholder="Email Address" value={loginData.email} onChange={(e) => { setLoginData({ ...loginData, email: e.target.value }); setLoginMessage(''); }} />
                        </div>

                        <div className="flex bg-white border border-gray-200 p-5 gap-5 items-center mb-3">
                            <label className="text-sm w-32">Password</label>
                            <input required type="password" className="flex-1 border-none p-0 text-sm" placeholder="Password" value={loginData.password} onChange={(e) => { setLoginData({ ...loginData, password: e.target.value }); setLoginMessage(''); }} />
                        </div>

                        <div>
                            <button className={btn}>LOG IN</button>
                            {loginMessage && <div className="mt-3 text-sm text-red-600">{loginMessage}</div>}
                        </div>

                        <div className="mt-3">
                            <a href="#" className="text-sm text-blue-500">Forgot Password?</a>
                        </div>

                        <p className="text-xs text-gray-500 mt-4">
                            By clicking 'Log In', I agree to the Terms and Conditions and Privacy Policy.
                        </p>
                    </form>
                </div>
            </div>


        </main>
    );
}

// Tailwind helpers
const input = "w-full px-4 py-2 border rounded-md";
const btn = "w-full bg-btn text-white py-3  font-semibold";
