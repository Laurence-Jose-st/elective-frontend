import { useState, useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Tabs, Tab, Button, Badge, Table, Modal, Form, Alert } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import { adminService } from '../services/api'
import '../App.css'

function AdminPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'users' | 'broadcast' | 'database'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastTargetType, setBroadcastTargetType] = useState<'all' | 'specific'>('all')
  const [targetUserId, setTargetUserId] = useState<number | null>(null)
  
  // Food Item Modal
  const [showFoodModal, setShowFoodModal] = useState(false)
  const [foodForm, setFoodForm] = useState({
    name: '',
    category: 'Uncategorized',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    fiber: ''
  })
  
  // Exercise Modal
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    body_part: '',
    target: '',
    equipment: '',
    gif_url: ''
  })

  useEffect(() => {
    console.log('AdminPage - User role check:', user?.role)
    console.log('AdminPage - User role (uppercase):', user?.role?.toUpperCase())
    
    if (!user || user.role?.toUpperCase() !== 'ADMIN') {
      console.log('Access denied - redirecting to dashboard')
      window.location.href = '/dashboard'
      return
    }
    fetchUsers()
    fetchNotifications()
  }, [user])

  const fetchUsers = async () => {
    try {
      console.log('Fetching users from backend...')
      const response = await adminService.getAllUsers()
      console.log('Users fetched:', response.data)
      setUsers(response.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Failed to fetch users from backend')
    }
  }

  const fetchNotifications = async () => {
    try {
      // TODO: Implement API call to fetch notifications
      setNotifications([])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const handleFlagUser = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      await adminService.toggleUserFlag(userId, !user.flagged)
      alert(`User ${user.flagged ? 'unflagged' : 'flagged'} successfully`)
      fetchUsers() // Refresh list
    } catch (error) {
      console.error('Error flagging user:', error)
      alert('Failed to update user status')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      await adminService.deleteUser(userId)
      alert('User deleted successfully')
      fetchUsers() // Refresh list
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const handleSendBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage) {
      alert('Please fill in both title and message')
      return
    }

    try {
      const payload: any = {
        title: broadcastTitle,
        message: broadcastMessage,
        targetType: broadcastTargetType
      }

      if (broadcastTargetType === 'specific' && targetUserId) {
        payload.targetUserId = targetUserId
      }

      await adminService.sendBroadcast(broadcastTitle, broadcastMessage, broadcastTargetType, targetUserId || undefined)
      setShowBroadcastModal(false)
      setBroadcastTitle('')
      setBroadcastMessage('')
      setBroadcastTargetType('all')
      setTargetUserId(null)
      alert('Broadcast sent successfully!')
      fetchNotifications()
    } catch (error) {
      console.error('Error sending broadcast:', error)
      alert('Failed to send broadcast')
    }
  }

  const handleAddFoodItem = async () => {
    if (!foodForm.name || !foodForm.calories) {
      alert('Please fill in food name and calories')
      return
    }

    try {
      await adminService.addFoodItem({
        name: foodForm.name,
        category: foodForm.category,
        calories: parseFloat(foodForm.calories),
        protein: foodForm.protein ? parseFloat(foodForm.protein) : 0,
        carbs: foodForm.carbs ? parseFloat(foodForm.carbs) : 0,
        fats: foodForm.fats ? parseFloat(foodForm.fats) : 0,
        fiber: foodForm.fiber ? parseFloat(foodForm.fiber) : 0
      })
      setShowFoodModal(false)
      setFoodForm({
        name: '',
        category: 'Uncategorized',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        fiber: ''
      })
      alert('Food item added successfully!')
    } catch (error) {
      console.error('Error adding food item:', error)
      alert('Failed to add food item')
    }
  }

  const handleAddExercise = async () => {
    if (!exerciseForm.name || !exerciseForm.body_part || !exerciseForm.target || !exerciseForm.equipment) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await adminService.addExercise({
        name: exerciseForm.name,
        body_part: exerciseForm.body_part,
        target: exerciseForm.target,
        equipment: exerciseForm.equipment,
        gif_url: exerciseForm.gif_url
      })
      setShowExerciseModal(false)
      setExerciseForm({
        name: '',
        body_part: '',
        target: '',
        equipment: '',
        gif_url: ''
      })
      alert('Exercise added successfully!')
    } catch (error) {
      console.error('Error adding exercise:', error)
      alert('Failed to add exercise')
    }
  }

  if (!user || user.role?.toUpperCase() !== 'ADMIN') {
    return (
      <div className="container mt-5">
        <Alert variant="danger">
          <Alert.Heading>Access Denied</Alert.Heading>
          <p>You don't have permission to access this page.</p>
          <Button variant="primary" onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">Admin Dashboard</h1>
          
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k as any)} className="mb-4">
            <Tab eventKey="users" title="User Management">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-4">All Users</h5>
                  <Table striped hover responsive>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td>{u.username}</td>
                          <td>{u.email}</td>
                          <td>{u.role}</td>
                          <td>
                            {u.flagged ? (
                              <Badge bg="danger">Flagged</Badge>
                            ) : (
                              <Badge bg="success">Active</Badge>
                            )}
                          </td>
                          <td>{new Date(u.created_at).toLocaleDateString()}</td>
                          <td>
                            <Button
                              variant={u.flagged ? "success" : "warning"}
                              size="sm"
                              className="me-2"
                              onClick={() => handleFlagUser(u.id)}
                            >
                              {u.flagged ? 'Unflag' : 'Flag'}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Tab>

            <Tab eventKey="broadcast" title="Broadcast Messaging">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-4">Send Broadcast</h5>
                  <Button variant="primary" onClick={() => setShowBroadcastModal(true)}>
                    <i className="bi bi-megaphone"></i> Send New Broadcast
                  </Button>
                  
                  <h6 className="mt-4 mb-3">Recent Broadcasts</h6>
                  {notifications.length === 0 ? (
                    <Alert variant="info">No broadcasts sent yet.</Alert>
                  ) : (
                    <div className="list-group">
                      {notifications.map((n) => (
                        <div key={n.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{n.title}</strong>
                              <p className="mb-0 text-muted small">{n.message}</p>
                            </div>
                            <small className="text-muted">
                              {new Date(n.created_at).toLocaleString()}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Tab>

            <Tab eventKey="database" title="Database Management">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-4">Database Management</h5>
                  <Alert variant="info">
                    <p className="mb-0">
                      <strong>Food Items:</strong> Add or manage food database entries.<br/>
                      <strong>Exercises:</strong> Add or manage exercise database entries.
                    </p>
                  </Alert>
                  <div className="row mt-3">
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-title">Food Database</h6>
                          <Button variant="primary" className="w-100" onClick={() => setShowFoodModal(true)}>
                            Add Food Item
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-title">Exercise Database</h6>
                          <Button variant="primary" className="w-100" onClick={() => setShowExerciseModal(true)}>
                            Add Exercise
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>

      {/* Broadcast Modal */}
      <Modal show={showBroadcastModal} onHide={() => setShowBroadcastModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Send Broadcast Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Enter broadcast title..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Target Audience</Form.Label>
              <Form.Select
                value={broadcastTargetType}
                onChange={(e) => setBroadcastTargetType(e.target.value as 'all' | 'specific')}
              >
                <option value="all">All Users</option>
                <option value="specific">Specific User</option>
              </Form.Select>
            </Form.Group>
            {broadcastTargetType === 'specific' && (
              <Form.Group className="mb-3">
                <Form.Label>Select User</Form.Label>
                <Form.Select
                  value={targetUserId || ''}
                  onChange={(e) => setTargetUserId(Number(e.target.value))}
                >
                  <option value="">-- Select a user --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter your message..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBroadcastModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSendBroadcast}>
            Send Broadcast
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Food Item Modal */}
      <Modal show={showFoodModal} onHide={() => setShowFoodModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Food Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Food Name</Form.Label>
              <Form.Control
                type="text"
                value={foodForm.name}
                onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                placeholder="Enter food name..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={foodForm.category}
                onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
              >
                <option value="Uncategorized">Uncategorized</option>
                <option value="Protein">Protein</option>
                <option value="Carbohydrates">Carbohydrates</option>
                <option value="Fats">Fats</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Dairy">Dairy</option>
                <option value="Beverages">Beverages</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Calories (per 100g)</Form.Label>
              <Form.Control
                type="number"
                value={foodForm.calories}
                onChange={(e) => setFoodForm({ ...foodForm, calories: e.target.value })}
                placeholder="Calories"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Protein (g)</Form.Label>
              <Form.Control
                type="number"
                value={foodForm.protein}
                onChange={(e) => setFoodForm({ ...foodForm, protein: e.target.value })}
                placeholder="Protein"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Carbs (g)</Form.Label>
              <Form.Control
                type="number"
                value={foodForm.carbs}
                onChange={(e) => setFoodForm({ ...foodForm, carbs: e.target.value })}
                placeholder="Carbs"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fats (g)</Form.Label>
              <Form.Control
                type="number"
                value={foodForm.fats}
                onChange={(e) => setFoodForm({ ...foodForm, fats: e.target.value })}
                placeholder="Fats"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fiber (g)</Form.Label>
              <Form.Control
                type="number"
                value={foodForm.fiber}
                onChange={(e) => setFoodForm({ ...foodForm, fiber: e.target.value })}
                placeholder="Fiber"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFoodModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddFoodItem}>
            Add Food Item
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal show={showExerciseModal} onHide={() => setShowExerciseModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Exercise</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Exercise Name</Form.Label>
              <Form.Control
                type="text"
                value={exerciseForm.name}
                onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                placeholder="Enter exercise name..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Body Part</Form.Label>
              <Form.Select
                value={exerciseForm.body_part}
                onChange={(e) => setExerciseForm({ ...exerciseForm, body_part: e.target.value })}
              >
                <option value="">Select body part...</option>
                <option value="Chest">Chest</option>
                <option value="Back">Back</option>
                <option value="Shoulders">Shoulders</option>
                <option value="Arms">Arms</option>
                <option value="Legs">Legs</option>
                <option value="Core">Core</option>
                <option value="Full Body">Full Body</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Target Muscle</Form.Label>
              <Form.Select
                value={exerciseForm.target}
                onChange={(e) => setExerciseForm({ ...exerciseForm, target: e.target.value })}
              >
                <option value="">Select target...</option>
                <option value="Strength">Strength</option>
                <option value="Hypertrophy">Hypertrophy</option>
                <option value="Endurance">Endurance</option>
                <option value="Flexibility">Flexibility</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Equipment</Form.Label>
              <Form.Select
                value={exerciseForm.equipment}
                onChange={(e) => setExerciseForm({ ...exerciseForm, equipment: e.target.value })}
              >
                <option value="">Select equipment...</option>
                <option value="Barbell">Barbell</option>
                <option value="Dumbbell">Dumbbell</option>
                <option value="Machine">Machine</option>
                <option value="Cable">Cable</option>
                <option value="Bodyweight">Bodyweight</option>
                <option value="Kettlebell">Kettlebell</option>
                <option value="Resistance Band">Resistance Band</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>GIF URL (Optional)</Form.Label>
              <Form.Control
                type="text"
                value={exerciseForm.gif_url}
                onChange={(e) => setExerciseForm({ ...exerciseForm, gif_url: e.target.value })}
                placeholder="Enter GIF URL..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExerciseModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddExercise}>
            Add Exercise
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default AdminPage
