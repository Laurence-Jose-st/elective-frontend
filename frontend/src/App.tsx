import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import SignupPage from './pages/SignupPage'
import WorkoutPage from './pages/WorkoutPage'
import MealsPage from './pages/MealsPage'
import CalculatorPage from './pages/CalculatorPage'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import { AuthProvider } from './contexts/AuthContext'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './App.css'

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navigation />
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
            <MainLayout>
              <Dashboard />
            </MainLayout>
          } />
          <Route path="/home" element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          } />
          <Route path="/workout" element={
            <MainLayout>
              <WorkoutPage />
            </MainLayout>
          } />
          <Route path="/meals" element={
            <MainLayout>
              <MealsPage />
            </MainLayout>
          } />
          <Route path="/calculator" element={
            <MainLayout>
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
