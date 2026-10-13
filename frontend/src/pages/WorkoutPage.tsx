import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import WorkoutCharts from '../components/WorkoutCharts'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Modal } from 'react-bootstrap'
import '../App.css'
import { workoutService } from '../services/api'

interface Exercise {
  id: string
  name: string
  body_part: string
  target: string
  equipment: string
}

interface Session {
  id: string
  name: string
  status: string
  start_time: string
  session_exercises: any[]
}

function WorkoutPage() {
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [refreshCharts, setRefreshCharts] = useState(0)
  const [previousWorkout, setPreviousWorkout] = useState<any>(null)
  const [formValues, setFormValues] = useState({ sets: '', reps: '', weight: '', duration: '' })
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchActiveSession()
    fetchWorkoutHistory()
  }, [])

  const fetchActiveSession = async () => {
    try {
      const response = await workoutService.getActiveSession()
      setActiveSession(response.data)
    } catch (error: any) {
      // No active session exists or error occurred
      console.log('No active session:', error)
      setActiveSession(null)
    }
  }

  const fetchWorkoutHistory = async () => {
    try {
      const workouts = await workoutService.getWorkouts()
      // Store workouts by exercise name for quick lookup
      const workoutMap: Record<string, any> = {}
      workouts.forEach((w: any) => {
        workoutMap[w.exercise_name] = w
      })
      setPreviousWorkout(workoutMap)
    } catch (error) {
      console.error('Error fetching workout history:', error)
    }
  }

  const handleStartSession = async () => {
    try {
      const response = await workoutService.startSession('Workout Session')
      setActiveSession(response.data)
    } catch (error: any) {
      console.error('Error starting session:', error)
      alert(`Failed to start session: ${error.message || 'Unknown error'}`)
    }
  }

  const handleCompleteSession = async () => {
    if (!activeSession) return

    try {
      await workoutService.completeSession(activeSession.id)
      setActiveSession(null)
      setCompletedExercises(new Set())
      setRefreshCharts(prev => prev + 1)
      fetchWorkoutHistory() // Refresh workout history
    } catch (error: any) {
      console.error('Error completing session:', error)
      alert(`Failed to complete session: ${error.message || 'Unknown error'}`)
    }
  }

  const handleCancelSession = async () => {
    if (!activeSession) return

    try {
      await workoutService.cancelSession(activeSession.id)
      setActiveSession(null)
      setCompletedExercises(new Set())
    } catch (error: any) {
      console.error('Error canceling session:', error)
      alert(`Failed to cancel session: ${error.message || 'Unknown error'}`)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await workoutService.searchExercises(query)
      setSearchResults(response.data || [])
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setSearchQuery(exercise.name)
    setSearchResults([])

    // Auto-fill form with previous workout data if available
    if (previousWorkout && previousWorkout[exercise.name]) {
      const prevData = previousWorkout[exercise.name]
      setFormValues({
        sets: '3',
        reps: String(prevData.reps || 10),
        weight: String(prevData.weight || 0),
        duration: String(prevData.duration || 30)
      })
    } else {
      // Reset to defaults if no previous data
      setFormValues({ sets: '3', reps: '10', weight: '0', duration: '30' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!activeSession) {
      alert('Please start a session first!')
      return
    }

    if (!selectedExercise) {
      alert('Please select an exercise!')
      return
    }

    const exerciseData = {
      sets: parseInt(formValues.sets) || 0,
      reps: parseInt(formValues.reps) || 0,
      weight: parseFloat(formValues.weight) || 0,
      duration: parseInt(formValues.duration) || 0,
    }

    try {
      await workoutService.addExerciseToSession(
        activeSession.id,
        selectedExercise.id,
        exerciseData
      )
      setRefreshCharts(prev => prev + 1)
      fetchWorkoutHistory() // Refresh workout history after adding
      setShowModal(false)
      setSelectedExercise(null)
      setSearchQuery('')
      setFormValues({ sets: '', reps: '', weight: '', duration: '' })
      // Refresh active session to show new exercises
      fetchActiveSession()
    } catch (error) {
      console.error('Error adding exercise to session:', error)
    }
  }

  const toggleExerciseComplete = (sessionExerciseId: string) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionExerciseId)) {
        newSet.delete(sessionExerciseId)
      } else {
        newSet.add(sessionExerciseId)
      }
      return newSet
    })
  }
  return (
    <>
      <div className="container-fluid py-3 px-5">
        <div className="row align-items-center">
          <div className="col-4">
            <h1 className="mb-0 bbh-bartle-regular">Workout</h1>
          </div>
          <div className="col-8">
            <div className="row">
              <Navigation />
            </div>
          </div>
        </div>
      </div>

      <WorkoutCharts refreshTrigger={refreshCharts} />

      {/* Session Card */}
      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <div className="card border-0" style={{ minHeight: '200px' }}>
              <div className="card-body d-flex flex-column">
                {!activeSession ? (
                  <>
                    <button
                      className="btn btn-primary w-25 btn-font align-self-center" 
                      onClick={handleStartSession}
                    >
                      Start Session
                    </button>
                  </>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="m-0">Session Progress: {activeSession.name}</h5>
                      <button
                        className="btn btn-sm text-muted"
                        onClick={handleCancelSession}
                        style={{ fontSize: '1.5rem' }}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                    <div className="list-group">
                      <div
                        className="list-group-item d-flex justify-content-between align-items-center"
                        onClick={() => setShowModal(true)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="text-primary">Add Workout</span>
                        <i className="bi bi-plus-lg text-primary"></i>
                      </div>
                      {activeSession.session_exercises && activeSession.session_exercises.length > 0 && activeSession.session_exercises.map((se: any) => {
                        const firstSet = se.workout_sets && se.workout_sets.length > 0 ? se.workout_sets[0] : null
                        return (
                        <div
                          key={se.id}
                          className={`list-group-item d-flex justify-content-between align-items-center ${completedExercises.has(se.id) ? 'list-group-item-success' : ''}`}
                        >
                          <div>
                            <div className="text-fonts fw-bold">{se.exercises?.name || 'Exercise'}</div>
                            {firstSet && (
                              <small className="text-fonts text-muted">
                                {se.workout_sets?.length || 0} sets × {firstSet.reps} reps × {firstSet.weight} lbs × {firstSet.duration} min
                              </small>
                            )}
                          </div>
                          <button
                            className={`btn btn-sm ${completedExercises.has(se.id) ? 'btn-success' : 'btn-outline-secondary'}`}
                            onClick={() => toggleExerciseComplete(se.id)}
                          >
                            {completedExercises.has(se.id) ? '✓' : '○'}
                          </button>
                        </div>
                        )
                      })}
                    </div>
                    <div className="d-flex justify-content-center mt-auto pt-3">
                      {activeSession.session_exercises && activeSession.session_exercises.length > 0 && (
                      <button
                        className="btn btn-font btn-primary btn-size"
                        onClick={handleCompleteSession}
                      >
                        Complete Session
                      </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>



      <Modal show={showModal} size="lg" centered onHide={() => {
        setShowModal(false)
        setSelectedExercise(null)
        setSearchQuery('')
        setSearchResults([])
        setFormValues({ sets: '', reps: '', weight: '', duration: '' })
      }}>
        <Modal.Header className="border-0 mt-2 ms-3" closeButton>
          <Modal.Title>Add Workout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit}>
            <div className="card mb-2 border-0">
              <div className="card-body">
                <div className="mb-3 position-relative">
                  <label htmlFor="exerciseName" className="form-label">Exercise Name</label>
                  <input
                    type="text"
                    className="form-control border-0 border-bottom"
                    id="exerciseName"
                    name="exerciseName"
                    placeholder="Search exercises (e.g., Bench Press)"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoComplete="off"
                  />
                  {searchResults.length > 0 && (
                    <div className="position-absolute w-100 bg-white border rounded shadow-lg mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                      {searchResults.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="p-2 text-fonts search-result-item"
                          onClick={() => handleExerciseSelect(exercise)}
                        >
                          <div className="fw-bold">{exercise.name}</div>
                          <small className="text-muted">
                            {exercise.body_part} • {exercise.target} • {exercise.equipment}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                  {isSearching && (
                    <div className="position-absolute w-100 bg-white border rounded shadow-lg mt-1 p-2 text-muted" style={{ zIndex: 1000 }}>
                      Searching...
                    </div>
                  )}
                </div>
                {selectedExercise && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-fonts text-muted">
                      <strong>Selected:</strong> {selectedExercise.name} ({selectedExercise.body_part} - {selectedExercise.equipment})
                    </small>
                  </div>
                )}
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <label htmlFor="sets" className="form-label">Sets</label>
                    <input
                      type="number"
                      className="form-control border-0 border-bottom"
                      id="sets"
                      name="sets"
                      placeholder="3"
                      value={formValues.sets}
                      onChange={(e) => setFormValues({ ...formValues, sets: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label htmlFor="reps" className="form-label">Reps</label>
                    <input
                      type="number"
                      className="form-control border-0 border-bottom"
                      id="reps"
                      name="reps"
                      placeholder="10"
                      value={formValues.reps}
                      onChange={(e) => setFormValues({ ...formValues, reps: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label htmlFor="weight" className="form-label">Weight (lbs)</label>
                    <input
                      type="number"
                      className="form-control border-0 border-bottom"
                      id="weight"
                      name="weight"
                      placeholder="135"
                      value={formValues.weight}
                      onChange={(e) => setFormValues({ ...formValues, weight: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label htmlFor="duration" className="form-label">Duration (min)</label>
                    <input
                      type="number"
                      className="form-control border-0 border-bottom"
                      id="duration"
                      name="duration"
                      placeholder="30"
                      value={formValues.duration}
                      onChange={(e) => setFormValues({ ...formValues, duration: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <button type="submit" className="btn btn-font btn-primary mt-3 mb-2" style={{ padding: '10px 20px', fontSize: '16px' }}> Add Workout </button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  )

}

export default WorkoutPage
