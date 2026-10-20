import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'

interface SignupProps {
    onSubmit?: (data: { username: string; email: string; password: string; verificationToken: string }) => void
    title?: string
}

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : 'https://my-working-backend.vercel.app/api')

function Signup({ onSubmit, title = 'Signup' }: SignupProps) {
    const location = useLocation()
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [verificationToken, setVerificationToken] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSendingCode, setIsSendingCode] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [codeSent, setCodeSent] = useState(false)
    const [emailVerified, setEmailVerified] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Check if user came from email verification
    useEffect(() => {
        if (location.state?.email && location.state?.token) {
            setEmail(location.state.email)
            setVerificationToken(location.state.token)
            setEmailVerified(true)
        }
    }, [location.state])

    // Send verification code when email is entered (debounced)
    useEffect(() => {
        const sendCode = async () => {
            if (!email || emailVerified) return

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) return

            setIsSendingCode(true)
            setError('')
            try {
                const response = await fetch(`${API_BASE}/users/auth/request-verification`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                })

                const data = await response.json()

                if (data.success) {
                    setCodeSent(true)
                } else {
                    // Handle specific error codes
                    if (data.code === 'EMAIL_ALREADY_REGISTERED') {
                        setError('This email is already registered. Please log in.')
                    } else if (data.code === 'EMAIL_NOT_REAL') {
                        setError('This email address does not exist or cannot receive emails. Please use a valid email.')
                    } else {
                        setError(data.error || 'Failed to send verification code')
                    }
                }
            } catch (err) {
                console.error('Verification request error:', err)
            } finally {
                setIsSendingCode(false)
            }
        }

        const debounceTimer = setTimeout(() => {
            sendCode()
        }, 1000)

        return () => clearTimeout(debounceTimer)
    }, [email, emailVerified])

    const handleVerifyCode = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setError('Please enter a valid 6-digit code')
            return
        }

        setIsVerifying(true)
        setError('')

        try {
            const response = await fetch(`${API_BASE}/users/auth/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code: verificationCode }),
            })

            const data = await response.json()

            if (data.success) {
                setEmailVerified(true)
                setVerificationToken(data.data.verificationToken)
            } else {
                setError(data.error || 'Invalid verification code')
            }
        } catch (err) {
            console.error('Verification error:', err)
            setError('Failed to verify code')
        } finally {
            setIsVerifying(false)
        }
    }

    const handleResendCode = async () => {
        setIsSendingCode(true)
        setError('')

        try {
            const response = await fetch(`${API_BASE}/users/auth/request-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (data.success) {
                setCodeSent(true)
                setError('')
            } else {
                setError(data.error || 'Failed to send verification code')
            }
        } catch (err) {
            console.error('Verification request error:', err)
            setError('Failed to send verification code')
        } finally {
            setIsSendingCode(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!emailVerified) {
            setError('Please verify your email first')
            return
        }

        setIsLoading(true)

        try {
            if (onSubmit) {
                await onSubmit({ username, email, password, verificationToken })
            }
        } catch (err) {
            setError('Signup failed')
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="col-md-6 col-lg-4">
                <div className="card shadow bg-charcoal border-0 rounded-4">
                    <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="card-title text-center mb-0 text-pure-white text-fonts">{title}</h2>
                            <a
                                href="/login"
                                className="text-decoration-none text-off-white text-fonts"
                                style={{ fontSize: '0.9rem' }}
                            >
                                <i className="bi bi-arrow-left"></i> Back
                            </a>
                        </div>

                        {error && (
                            <div className="alert alert-danger bg-charcoal border-0 text-pure-white" role="alert">
                                {error}
                            </div>
                        )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label text-pure-white text-fonts">Username</label>
                            <input
                                type="text"
                                className="form-control border-0 border-bottom bg-charcoal text-pure-white text-fonts"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Enter your username"
                            />
                        </div>


                            <div className="mb-3">
                                <label htmlFor="email" className="form-label text-pure-white text-fonts">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    className="form-control border-0 border-bottom bg-charcoal text-pure-white text-fonts"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={emailVerified}
                                    required
                                    placeholder="Enter your email"
                                />
                                {isSendingCode && (
                                    <small className="text-off-white text-fonts">Sending verification code...</small>
                                )}
                                {codeSent && !emailVerified && (
                                    <small className="text-neon-yellow text-fonts">Verification code sent!</small>
                                )}
                                {emailVerified && (
                                    <small className="text-neon-yellow text-fonts">✓ Email verified</small>
                                )}
                            </div>

                            {!emailVerified && codeSent && (
                                <div className="mb-3">
                                    <label htmlFor="verificationCode" className="form-label text-pure-white text-fonts">
                                        Verification Code
                                    </label>
                                    <div className="d-flex gap-2">
                                        <input
                                            type="text"
                                            className="form-control border-0 border-bottom bg-charcoal text-pure-white text-fonts"
                                            id="verificationCode"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            required
                                            maxLength={6}
                                            placeholder="Enter 6-digit code"
                                            style={{ fontSize: '20px', letterSpacing: '4px', textAlign: 'center' }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-primary border-0 text-fonts"
                                            onClick={handleVerifyCode}
                                            disabled={isVerifying || verificationCode.length !== 6}
                                        >
                                            {isVerifying ? 'Verifying...' : 'Verify'}
                                        </button>
                                    </div>
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            className="btn btn-link text-off-white text-fonts p-0"
                                            onClick={handleResendCode}
                                            disabled={isSendingCode}
                                        >
                                            Resend code
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="mb-3">
                                <label htmlFor="password" className="form-label text-pure-white text-fonts">
                                    Password
                                </label>
                                <div className="position-relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="form-control border-0 border-bottom bg-charcoal text-pure-white text-fonts"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="Enter your password (min 6 characters)"
                                    />
                                    <button
                                        type="button"
                                        className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent"
                                        style={{ right: '10px', color: '#ecececb6', cursor: 'pointer' }}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <i className="bi bi-eye-slash"></i>
                                        ) : (
                                            <i className="bi bi-eye"></i>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100 border-0 text-fonts"
                                disabled={isLoading || !emailVerified}
                            >
                                {isLoading ? 'Signing up...' : 'Signup'}
                            </button>
                        </form>


                        <div className="mt-3 text-center">
                            <span className="text-off-white text-fonts">Already have an account? </span>
                            <a href="/login" className="text-decoration-none text-pure-white text-fonts">
                                Login
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Signup;