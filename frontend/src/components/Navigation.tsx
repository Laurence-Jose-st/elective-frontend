import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Offcanvas, Button, Dropdown, Badge } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import { adminService } from '../services/api'
import '../App.css'

const userNavItems = [
  { label: 'Home', path: '/dashboard' },
  { label: 'Workout', path: '/workout' },
  { label: 'Meals', path: '/meals' },
  { label: 'Calculator', path: '/calculator' }
]

const adminNavItems = [
  { label: 'Users', path: '/admin' },
  { label: 'Broadcast', path: '/admin' },
  { label: 'Database', path: '/admin' }
]

function Navigation() {
  const [showDrawer, setShowDrawer] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, logout } = useAuth()

  const handleClose = () => setShowDrawer(false)
  const handleShow = () => setShowDrawer(true)

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const response = await adminService.getNotifications()
      const unread = response.data.filter((n: any) => !n.read).length
      setNotifications(response.data)
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Temporarily disable notifications until table is created
      console.log('Notifications feature disabled until database migration is applied')
      setNotifications([])
      setUnreadCount(0)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await adminService.markNotificationRead(notificationId)
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN'
  const navItems = isAdmin ? adminNavItems : userNavItems

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

        {!user ? (
          <>
            <li className="nav-item">
              <NavLink to="/login" className="nav-link text-dark">
                Login
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/signup" className="nav-link text-dark">
                Sign Up
              </NavLink>
            </li>
          </>
        ) : (
          <>
            {!isAdmin && (
              <li className="nav-item me-2">
                <Dropdown show={showNotifications} onToggle={(isOpen) => setShowNotifications(isOpen)}>
                  <Dropdown.Toggle
                    variant="link"
                    className="nav-link text-dark position-relative p-0"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    title="Notifications"
                  >
                    <span style={{ fontFamily: 'bootstrap-icons', fontSize: '1.5rem' }}>
                      {"\uF132"}
                    </span>
                    {unreadCount > 0 && (
                      <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ fontSize: '0.6rem' }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end" style={{ minWidth: '300px', maxHeight: '400px', overflowY: 'auto' }}>
                    <Dropdown.Header>Notifications</Dropdown.Header>
                    {notifications.length === 0 ? (
                      <Dropdown.ItemText className="text-muted text-center py-3">
                        No notifications
                      </Dropdown.ItemText>
                    ) : (
                      notifications.map((notification) => (
                        <Dropdown.Item
                          key={notification.id}
                          className={notification.read ? 'text-muted' : 'fw-bold'}
                          onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                          style={{ cursor: !notification.read ? 'pointer' : 'default' }}
                        >
                          <div className="mb-1">{notification.title}</div>
                          <div className="small text-muted">{notification.message}</div>
                          <div className="small text-muted mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </div>
                        </Dropdown.Item>
                      ))
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </li>
            )}
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
          </>
        )}
      </ul>

      <Offcanvas show={showDrawer} onHide={handleClose} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Profile</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="mb-4">
            <h5>Welcome, {user?.username || 'User'}!</h5>
            <p className="text-muted">{user?.email}</p>
            <Badge bg={isAdmin ? 'danger' : 'success'} className="mb-2">
              {isAdmin ? 'ADMIN' : 'REGISTERED'}
            </Badge>
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