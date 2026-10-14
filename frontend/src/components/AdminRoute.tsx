import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface AdminRouteProps {
  children: React.ReactNode
}

function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('AdminRoute - User role check:', user?.role)
    console.log('AdminRoute - User role (uppercase):', user?.role?.toUpperCase())
    console.log('AdminRoute - Loading state:', loading)
    
    // Don't redirect while loading
    if (loading) {
      console.log('Still loading auth state, waiting...')
      return
    }

    if (!user) {
      console.log('No user found, redirecting to login')
      navigate('/login')
      return
    }

    if (user.role?.toUpperCase() !== 'ADMIN') {
      console.log('User is not ADMIN, redirecting to dashboard')
      navigate('/dashboard')
      return
    }
  }, [user, loading, navigate])

  // Show loading state
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user || user.role?.toUpperCase() !== 'ADMIN') {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <h5>Access Denied</h5>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default AdminRoute
