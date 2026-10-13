import Login from '../components/Login'
import { loginUser } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

function LoginPage() {
  const { login } = useAuth()

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      const response = await loginUser(credentials)
      console.log('Login successful:', response)

      // Use AuthContext login function
      login(response.data.token, response.data.user)

      window.location.href = '/dashboard'
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
