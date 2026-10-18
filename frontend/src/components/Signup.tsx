import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'

interface SignupProps {
    onSubmit?: (data: { username: string; email: string; password: string }) => void
    title?: string
}


function Signup({ onSubmit, title = 'Signup' }: SignupProps) {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            if (onSubmit) {
                await onSubmit({ username, email, password })
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
                                href="/"
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
                                    required
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="password" className="form-label text-pure-white text-fonts">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    className="form-control border-0 border-bottom bg-charcoal text-pure-white text-fonts"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password (min 6 characters)"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100 border-0 text-fonts"
                                disabled={isLoading}
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