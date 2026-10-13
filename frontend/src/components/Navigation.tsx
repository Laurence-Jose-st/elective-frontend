import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Offcanvas, Button } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

const navItems = [
  { label: 'Home', path: '/dashboard' },
  { label: 'Workout', path: '/workout' },
  { label: 'Meals', path: '/meals' }
]

function Navigation() {
  const [showDrawer, setShowDrawer] = useState(false)
  const { user, logout } = useAuth()

  const handleClose = () => setShowDrawer(false)
  const handleShow = () => setShowDrawer(true)

  return (
    <>
      <ul className="nav nav-underline justify-content-end align-items-center">
        {navItems.map((item) => (
          <li className="nav-item" key={item.path}>
            <NavLink to={item.path} className="nav-link text-dark">
              {item.label}
            </NavLink>
          </li>
        ))}
        <li className="nav-item">
          <button
            className="nav-link text-dark"
            onClick={handleShow}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', height: '100%' }}
          >
            <span style={{ fontFamily: 'bootstrap-icons', lineHeight: '1', color: 'black', fontSize: '2rem', position: 'relative', top: '-1px' }}>
              {"\uF4D7"}
            </span>
          </button>
        </li>
      </ul>

      <Offcanvas show={showDrawer} onHide={handleClose} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Profile</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="mb-4">
            <h5>Welcome, {user?.username || 'User'}!</h5>
            <p className="text-muted">{user?.email}</p>
          </div>
          <Button variant="danger" className="w-100" onClick={logout}>
            Logout
          </Button>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  )
}

export default Navigation