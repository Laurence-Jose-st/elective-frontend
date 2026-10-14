import 'bootstrap/dist/css/bootstrap.min.css'
import { useEffect } from 'react'

function HomePage() {
  useEffect(() => {
    window.location.href = '/'
  }, [])

  return (
    <div className="container mt-5 text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  )
}

export default HomePage
