import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Button, Form, Alert } from 'react-bootstrap'
import '../App.css'

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : 'https://my-working-backend.vercel.app/api')

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE}/users/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setEmail('')
      } else {
        setError(data.error || 'Failed to send password reset request. Please try again.')
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      setError('Failed to send password reset request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="col-md-6 col-lg-4">
        <div className="card shadow">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="card-title text-center mb-0">Forgot Password</h2>
              <a
                href="/login"
                className="text-decoration-none"
                style={{ color: '#6c757d', fontSize: '0.9rem' }}
              >
                <i className="bi bi-arrow-left"></i> Back
              </a>
            </div>

            {success ? (
              <Alert variant="success">
                <Alert.Heading>Password Reset Email Sent</Alert.Heading>
                <p className="mb-0">
                  If an account exists with the email you provided, you will receive password reset instructions shortly.
                </p>
                <div className="mt-3">
                  <Button variant="primary" onClick={() => window.location.href = '/login'}>
                    Return to Login
                  </Button>
                </div>
              </Alert>
            ) : (
              <>
                <p className="text-muted mb-4">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </Form>

                <div className="mt-3 text-center">
                  <span className="text-muted">Remember your password? </span>
                  <a href="/login" className="text-decoration-none">
                    Login
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
