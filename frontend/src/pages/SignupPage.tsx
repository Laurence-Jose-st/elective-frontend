import Signup from '../components/Signup'
import { registerUser } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

function SignupPage() {
  const { login } = useAuth()

  const handleSignup = async (data: { username: string; email: string; password: string }) => {
    try {
      const response = await registerUser(data)
      console.log('User signed up:', response)

      // Use AuthContext login function
      login(response.data.token, response.data.user)

      window.location.href = '/';
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }
  return (
    <Signup
      onSubmit={handleSignup}
      title="Create Account"
    />
  )
}

export default SignupPage;