import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Button, Form, Alert } from 'react-bootstrap'
import '../App.css'

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : 'https://my-working-backend.vercel.app/api')

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setError('Invalid or missing reset token. Please request a new password reset.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE}/users/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(data.error || 'Failed to reset password. Please try again.')
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.')
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
              <h2 className="card-title text-center mb-0 text-pure-white text-fonts">Reset Password</h2>
              <a
                href="/login"
                className="text-decoration-none text-off-white text-fonts"
                style={{ fontSize: '0.9rem' }}
              >
                <i className="bi bi-arrow-left"></i> Back
              </a>
            </div>

            {success ? (
              <Alert variant="success" className="bg-charcoal border-0 text-pure-white">
                <Alert.Heading className="text-pure-white">Password Reset Successful</Alert.Heading>
                <p className="mb-0 text-off-white text-fonts">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <div className="mt-3">
                  <Button variant="primary" className="border-0 text-fonts" onClick={() => window.location.href = '/login'}>
                    Go to Login
                  </Button>
                </div>
              </Alert>
            ) : (
              <>
                <p className="text-off-white text-fonts mb-4">
                  Enter your new password below.
                </p>

                {error && (
                  <div className="alert alert-danger bg-charcoal border-0 text-pure-white" role="alert">
                    {error}
                  </div>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-pure-white text-fonts">New Password</Form.Label>
                    <Form.Control
                      type="password"
                      className="border-0 border-bottom bg-charcoal text-pure-white text-fonts"
                      placeholder="Enter new password (min 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={!token}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="text-pure-white text-fonts">Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      className="border-0 border-bottom bg-charcoal text-pure-white text-fonts"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={!token}
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 border-0 text-fonts"
                    disabled={isLoading || !token}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </Form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
