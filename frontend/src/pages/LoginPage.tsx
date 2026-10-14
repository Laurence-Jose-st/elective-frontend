import Login from '../components/Login'
import { loginUser } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

function LoginPage() {
  const { login } = useAuth()

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      const response = await loginUser(credentials)
      console.log('Login successful:', response)
      console.log('User role from response:', response.data.user.role)
      console.log('User role (uppercase):', response.data.user.role?.toUpperCase())

      // Use AuthContext login function
      login(response.data.token, response.data.user)

      // Check user role (case-insensitive) and redirect accordingly
      const userRole = response.data.user.role?.toUpperCase()
      if (userRole === 'ADMIN') {
        console.log('User is ADMIN, redirecting to /admin')
        window.location.href = '/admin'
      } else {
        console.log('User is not ADMIN, redirecting to /')
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  return (
    <Login
      onLogin={handleLogin}
      title="Welcome Back"
    />
  )
}

export default LoginPage
