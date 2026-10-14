import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  console.log('UserRoute - User:', user)
  console.log('UserRoute - Loading:', loading)

  if (loading) {
    return <div className="text-center mt-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  }

  // Allow guests to access public preview
  if (!user) {
    console.log('UserRoute - No user (guest), allowing access')
    return <>{children}</>
  }

  const userRole = user.role?.toUpperCase()
  console.log('UserRoute - User role:', userRole)

  // Redirect admins to admin dashboard
  if (userRole === 'ADMIN') {
    console.log('UserRoute - User is ADMIN, redirecting to /admin')
    return <Navigate to="/admin" replace />
  }

  console.log('UserRoute - User is REGISTERED, allowing access')
  return <>{children}</>
}

export default UserRoute
