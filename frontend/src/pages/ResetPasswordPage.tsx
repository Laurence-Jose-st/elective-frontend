import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Button, Form, Alert } from 'react-bootstrap'
import '../App.css'

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
      const response = await fetch('http://localhost:5000/users/auth/reset-password', {
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
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="col-md-6 col-lg-4">
        <div className="card shadow">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="card-title text-center mb-0">Reset Password</h2>
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
                <Alert.Heading>Password Reset Successful</Alert.Heading>
                <p className="mb-0">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <div className="mt-3">
                  <Button variant="primary" onClick={() => window.location.href = '/login'}>
                    Go to Login
                  </Button>
                </div>
              </Alert>
            ) : (
              <>
                <p className="text-muted mb-4">
                  Enter your new password below.
                </p>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter new password (min 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={!token}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
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
                    className="w-100"
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
