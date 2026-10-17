import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminPage from './pages/AdminPage'
import AdminRoute from './components/AdminRoute'
import UserRoute from './components/UserRoute'
import WorkoutPage from './pages/WorkoutPage'
import MealsPage from './pages/MealsPage'
import CalculatorPage from './pages/CalculatorPage'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import { AuthProvider } from './contexts/AuthContext'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './App.css'

function MainLayout({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      {showNav && <Navigation />}
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <MainLayout showNav={false}>
              <Dashboard />
            </MainLayout>
          } />
          <Route path="/home" element={
            <MainLayout showNav={false}>
              <Dashboard />
            </MainLayout>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin" element={
            <AdminRoute>
              <MainLayout showNav={false}>
                <AdminPage />
              </MainLayout>
            </AdminRoute>
          } />
          <Route path="/dashboard" element={
            <UserRoute>
              <MainLayout showNav={false}>
                <Dashboard />
              </MainLayout>
            </UserRoute>
          } />
          <Route path="/workout" element={
            <UserRoute>
              <MainLayout showNav={false}>
                <WorkoutPage />
              </MainLayout>
            </UserRoute>
          } />
          <Route path="/meals" element={
            <UserRoute>
              <MainLayout showNav={false}>
                <MealsPage />
              </MainLayout>
            </UserRoute>
          } />
          <Route path="/calculator" element={
            <MainLayout showNav={false}>
              <CalculatorPage />
            </MainLayout>
          } />
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
