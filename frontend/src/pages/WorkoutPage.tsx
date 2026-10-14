import { useState, useEffect, useRef } from 'react'
import WorkoutCharts from '../components/WorkoutCharts'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Modal, Alert, Form, Button, ButtonGroup, Accordion, Badge } from 'react-bootstrap'
import '../App.css'
import { workoutService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

// Use web crypto API for UUID generation
const randomUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

interface Exercise {
  id: string
  name: string
  body_part: string
  target: string
  equipment: string
}

interface WorkoutSet {
  id: string
  setNumber: number
  weight: number
  reps: number
  isWarmup: boolean
  completed: boolean
}

interface SessionExercise {
  exerciseId: string
  exerciseName: string
  bodyPart: string
  target: string
  equipment: string
  notes?: string
  isCustom?: boolean
  sets: WorkoutSet[]
}

interface CompletedSession {
  id: string
  name: string
  start_time: string
  end_time: string
  duration_seconds: number
  notes: string
  session_exercises: any[]
}

function WorkoutPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'session' | 'history' | 'progression'>('session')
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [refreshCharts, setRefreshCharts] = useState(0)
  const [previousWorkout, setPreviousWorkout] = useState<any>(null)

  // Session Title Options
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')

  // Duration Tracking
  const [durationMode, setDurationMode] = useState<'timer' | 'manual'>('timer')
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const timerRef = useRef<number | null>(null)
  const [manualDuration, setManualDuration] = useState(45)
  const [manualDurationUnit, setManualDurationUnit] = useState<'min' | 'hrs'>('min')

  // Weight Unit Toggle
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs')

  // Session Exercises (Folder)
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([])

  // History & Progressive Overload
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([])
  const [progressiveOverloadData, setProgressiveOverloadData] = useState<any>(null)
  const [selectedExerciseForProgression, setSelectedExerciseForProgression] = useState<string>('all')

  // Quick duration presets
  const durationPresets = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '60 min', value: 60 },
    { label: '90 min', value: 90 },
    { label: '120 min', value: 120 },
  ]

  // Timer Effect
  useEffect(() => {
    if (isTimerRunning && durationMode === 'timer') {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
    }
  }, [isTimerRunning, durationMode])

  useEffect(() => {
    fetchWorkoutHistory()
    fetchCompletedSessions()
  }, [])

  const fetchWorkoutHistory = async () => {
    try {
      const workouts = await workoutService.getWorkouts()
      const workoutMap: Record<string, any> = {}
      workouts.forEach((w: any) => {
        workoutMap[w.exercise_name] = w
      })
      setPreviousWorkout(workoutMap)
    } catch (error) {
      console.error('Error fetching workout history:', error)
    }
  }

  const fetchCompletedSessions = async () => {
    if (!user) return
    try {
      const response = await workoutService.getCompletedSessions()
      setCompletedSessions(response.data || [])
    } catch (error) {
      console.error('Error fetching completed sessions:', error)
    }
  }

  const fetchProgressiveOverload = async (exerciseName?: string) => {
    if (!user) return
    try {
      const response = await workoutService.getProgressiveOverload(exerciseName)
      setProgressiveOverloadData(response.data)
    } catch (error) {
      console.error('Error fetching progressive overload:', error)
    }
  }

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleTimerStart = () => {
    setIsTimerRunning(true)
  }

  const handleTimerPause = () => {
    setIsTimerRunning(false)
  }

  const handleTimerStop = () => {
    setIsTimerRunning(false)
    setTimerSeconds(0)
  }

  const getSessionTitle = () => {
    return sessionTitle || 'Workout Session'
  }

  const handleCompleteSession = async () => {
    if (sessionExercises.length === 0) {
      alert('Please add at least one exercise before completing the session!')
      return
    }

    const title = getSessionTitle()
    if (!title || title === 'Workout Session') {
      alert('Please enter a session title')
      return
    }

    const durationMinutes = durationMode === 'timer'
      ? Math.max(1, Math.round(timerSeconds / 60))
      : manualDurationUnit === 'hrs'
        ? manualDuration * 60
        : manualDuration

    const payload = {
      name: getSessionTitle(),
      durationMinutes,
      weightUnit,
      notes: sessionNotes,
      exercises: sessionExercises,
    }

    try {
      await workoutService.saveSession(payload)
      setSessionExercises([])
      setSessionNotes('')
      setSessionTitle('')
      setTimerSeconds(0)
      setIsTimerRunning(false)
      setRefreshCharts(prev => prev + 1)
      fetchWorkoutHistory()
      fetchCompletedSessions()
      alert('Workout session saved successfully!')
    } catch (error: any) {
      console.error('Error completing session:', error)
      alert(`Failed to complete session: ${error.message || 'Unknown error'}`)
    }
  }

  const handleCancelSession = async () => {
    if (sessionExercises.length > 0) {
      if (!confirm('Are you sure you want to cancel this session? All exercises will be lost.')) {
        return
      }
    }
    setSessionExercises([])
    setSessionNotes('')
    setSessionTitle('')
    setTimerSeconds(0)
    setIsTimerRunning(false)
  }

  const handleCopySession = (session: any) => {
    if (!user) {
      alert('Please login to copy sessions')
      window.location.href = '/login'
      return
    }

    if (session.session_exercises && session.session_exercises.length > 0) {
      const copiedExercises = session.session_exercises.map((se: any) => ({
        exerciseId: se.exercise_id,
        exerciseName: se.exercises?.name || 'Exercise',
        bodyPart: se.exercises?.body_part || 'custom',
        target: se.exercises?.target || 'custom',
        equipment: se.exercises?.equipment || 'custom',
        notes: se.notes || '',
        isCustom: !se.exercise_id,
        sets: se.workout_sets?.map((set: any) => ({
          id: randomUUID(),
          setNumber: set.set_number,
          weight: Number(set.weight),
          reps: set.reps,
          isWarmup: set.is_warmup,
          completed: false
        })) || [
          {
            id: randomUUID(),
            setNumber: 1,
            weight: 0,
            reps: 0,
            isWarmup: false,
            completed: false
          }
        ]
      }))

      setSessionExercises(copiedExercises)
      setSessionTitle(session.name || 'Workout Session')
      setActiveTab('session')
      alert(`Copied ${copiedExercises.length} exercises from ${session.name}`)
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
  }

  const handleAddExerciseToSession = () => {
    // If a database exercise is selected, use it
    if (selectedExercise) {
      // Auto-fill with previous workout data if available
      let initialWeight = 0
      let initialReps = 0

      if (previousWorkout && previousWorkout[selectedExercise.name]) {
        const prevData = previousWorkout[selectedExercise.name]
        initialWeight = prevData.weight || 0
        initialReps = prevData.reps || 0
      }

      const newExercise: SessionExercise = {
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        bodyPart: selectedExercise.body_part,
        target: selectedExercise.target,
        equipment: selectedExercise.equipment,
        notes: '',
        sets: [
          {
            id: randomUUID(),
            setNumber: 1,
            weight: initialWeight,
            reps: initialReps,
            isWarmup: false,
            completed: false
          }
        ]
      }

      setSessionExercises([...sessionExercises, newExercise])
      setShowModal(false)
      setSelectedExercise(null)
      setSearchQuery('')
      setSearchResults([])
    } else if (searchQuery.trim()) {
      // Add as custom exercise if no database match selected
      const newExercise: SessionExercise = {
        exerciseId: crypto.randomUUID(),
        exerciseName: searchQuery.trim(),
        bodyPart: 'custom',
        target: 'custom',
        equipment: 'custom',
        notes: '',
        isCustom: true,
        sets: [
          {
            id: randomUUID(),
            setNumber: 1,
            weight: 0,
            reps: 0,
            isWarmup: false,
            completed: false
          }
        ]
      }

      setSessionExercises([...sessionExercises, newExercise])
      setShowModal(false)
      setSearchQuery('')
      setSearchResults([])
    } else {
      alert('Please enter an exercise name or select from the list')
    }
  }

  const toggleSetComplete = (exerciseIdx: number, _setIdx: number) => {
    const updated = [...sessionExercises]
    updated[exerciseIdx].sets[_setIdx].completed = !updated[exerciseIdx].sets[_setIdx].completed
    setSessionExercises(updated)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const parseSessionNotes = (notes: string) => {
    try {
      const parsed = JSON.parse(notes)
      return parsed.sessionNotes || ''
    } catch {
      return notes || ''
    }
  }

  const calculateSuggestedChallenge = (exerciseName: string) => {
    if (!previousWorkout || !previousWorkout[exerciseName]) {
      return null
    }

    const lastWorkout = previousWorkout[exerciseName]
    const suggestedWeight = weightUnit === 'lbs'
      ? lastWorkout.weight + 5
      : lastWorkout.weight + 2.5
    const suggestedReps = lastWorkout.reps + 1

    // Progressive Overload Formula: if hit target reps (>= 8), suggest weight increase; otherwise suggest reps increase
    const recommendation = lastWorkout.reps >= 8
      ? `Increase weight by ${weightUnit === 'lbs' ? '5' : '2.5'}${weightUnit}`
      : `Increase reps by 1-2 before adding weight`

    return {
      exerciseName,
      lastWeight: lastWorkout.weight,
      lastReps: lastWorkout.reps,
      suggestedWeight: Math.round(suggestedWeight * 10) / 10,
      suggestedReps,
      recommendation
    }
  }

  return (
    <>
      <div className="container-fluid py-3 px-5">
        <div className="row align-items-center">
          <div className="col-4">
            <h1 className="mb-0 bbh-bartle-regular">Workout</h1>
          </div>
          <div className="col-8">
            <div className="d-flex justify-content-end">
              <ButtonGroup>
                <Button
                  variant={activeTab === 'session' ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveTab('session')}
                >
                  Session
                </Button>
                <Button
                  variant={activeTab === 'history' ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveTab('history')}
                >
                  History
                </Button>
                <Button
                  variant={activeTab === 'progression' ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveTab('progression')}
                >
                  Progression
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </div>

      <WorkoutCharts refreshTrigger={refreshCharts} />

      {/* Session Tab */}
      {activeTab === 'session' && (
        <div className="container mt-4">
          <div className="row">
            <div className="col-12">
              <div className="card border-0" style={{ minHeight: '300px' }}>
                <div className="card-body d-flex flex-column">
                  {!user ? (
                    <Alert variant="warning" className="text-center">
                      <h5>Guest Mode</h5>
                      <p className="mb-2">You can view workout history, but logging new workouts requires an account.</p>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => window.location.href = '/login'}
                      >
                        Login to Log Workouts
                      </button>
                    </Alert>
                  ) : (
                    <>
                      {/* Session Title Selection */}
                      <div className="mb-3">
                        <label className="form-label fw-bold">Session Title</label>
                        <div className="position-relative">
                          <Form.Control
                            type="text"
                            list="session-title-presets"
                            placeholder="Select preset or type custom title..."
                            value={sessionTitle}
                            onChange={(e) => setSessionTitle(e.target.value)}
                          />
                          <datalist id="session-title-presets">
                            <option value="Push Day" />
                            <option value="Pull Day" />
                            <option value="Leg Day" />
                            <option value="Full Body" />
                          </datalist>
                        </div>
                      </div>

                      {/* Duration Tracking */}
                      <div className="mb-3">
                        <label className="form-label fw-bold">Duration Tracking</label>
                        <ButtonGroup className="mb-3 w-100">
                          <Button
                            variant={durationMode === 'timer' ? 'primary' : 'outline-primary'}
                            onClick={() => setDurationMode('timer')}
                          >
                            Timer
                          </Button>
                          <Button
                            variant={durationMode === 'manual' ? 'primary' : 'outline-primary'}
                            onClick={() => setDurationMode('manual')}
                          >
                            Manual
                          </Button>
                        </ButtonGroup>

                        {durationMode === 'timer' ? (
                          <div className="text-center py-3 bg-light rounded">
                            <h2 className="display-4 fw-bold mb-3">{formatTimer(timerSeconds)}</h2>
                            <div className="d-flex justify-content-center gap-2">
                              <Button variant="success" onClick={handleTimerStart} disabled={isTimerRunning}>
                                Start
                              </Button>
                              <Button variant="warning" onClick={handleTimerPause} disabled={!isTimerRunning}>
                                Pause
                              </Button>
                              <Button variant="danger" onClick={handleTimerStop}>
                                Stop
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="d-flex gap-2 mb-2">
                              {durationPresets.map(preset => (
                                <Button
                                  key={preset.value}
                                  variant={manualDuration === preset.value ? 'primary' : 'outline-primary'}
                                  size="sm"
                                  onClick={() => setManualDuration(preset.value)}
                                >
                                  {preset.label}
                                </Button>
                              ))}
                            </div>
                            <div className="d-flex gap-2">
                              <Form.Control
                                type="number"
                                value={manualDuration}
                                onChange={(e) => setManualDuration(Number(e.target.value))}
                                min="1"
                                className="flex-grow-1"
                              />
                              <Form.Select
                                value={manualDurationUnit}
                                onChange={(e) => setManualDurationUnit(e.target.value as any)}
                                style={{ width: '100px' }}
                              >
                                <option value="min">min</option>
                                <option value="hrs">hrs</option>
                              </Form.Select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Weight Unit Toggle */}
                      <div className="mb-3">
                        <ButtonGroup size="sm">
                          <Button
                            variant={weightUnit === 'lbs' ? 'primary' : 'outline-primary'}
                            onClick={() => setWeightUnit('lbs')}
                          >
                            lbs
                          </Button>
                          <Button
                            variant={weightUnit === 'kg' ? 'primary' : 'outline-primary'}
                            onClick={() => setWeightUnit('kg')}
                          >
                            kg
                          </Button>
                        </ButtonGroup>
                      </div>

                      <div className="list-group">
                        <div
                          className="list-group-item d-flex justify-content-between align-items-center"
                          onClick={() => setShowModal(true)}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="text-primary">Add Exercise</span>
                          <i className="bi bi-plus-lg text-primary"></i>
                        </div>
                        {sessionExercises.length > 0 && sessionExercises.map((exercise, exerciseIdx) => (
                          <div
                            key={exercise.exerciseId}
                            className="list-group-item"
                          >
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div className="fw-bold">
                                {exercise.exerciseName}
                                {exercise.isCustom && <Badge bg="secondary" className="ms-2">Custom</Badge>}
                              </div>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  const updated = [...sessionExercises]
                                  updated.splice(exerciseIdx, 1)
                                  setSessionExercises(updated)
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </div>
                            <small className="text-muted">
                              {exercise.bodyPart} • {exercise.equipment}
                            </small>
                            {exercise.notes && (
                              <small className="text-muted d-block mt-1">Note: {exercise.notes}</small>
                            )}
                            <div className="mt-2">
                              {exercise.sets.map((set, setIdx) => (
                                <div key={set.id} className="d-flex gap-2 align-items-center mb-1">
                                  <span className="text-muted small">Set {set.setNumber}:</span>
                                  <Form.Control
                                    type="number"
                                    size="sm"
                                    placeholder="Weight"
                                    value={set.weight || ''}
                                    onChange={(e) => {
                                      const updated = [...sessionExercises]
                                      updated[exerciseIdx].sets[setIdx].weight = Number(e.target.value)
                                      setSessionExercises(updated)
                                    }}
                                    style={{ width: '80px' }}
                                  />
                                  <span className="text-muted small">{weightUnit}</span>
                                  <span className="text-muted small">x</span>
                                  <Form.Control
                                    type="number"
                                    size="sm"
                                    placeholder="Reps"
                                    value={set.reps || ''}
                                    onChange={(e) => {
                                      const updated = [...sessionExercises]
                                      updated[exerciseIdx].sets[setIdx].reps = Number(e.target.value)
                                      setSessionExercises(updated)
                                    }}
                                    style={{ width: '70px' }}
                                  />
                                  <span className="text-muted small">reps</span>
                                  <Form.Check
                                    type="checkbox"
                                    label="Warmup"
                                    checked={set.isWarmup}
                                    onChange={(e) => {
                                      const updated = [...sessionExercises]
                                      updated[exerciseIdx].sets[setIdx].isWarmup = e.target.checked
                                      setSessionExercises(updated)
                                    }}
                                    className="ms-2"
                                  />
                                  <Form.Check
                                    type="checkbox"
                                    label="Done"
                                    checked={set.completed}
                                    onChange={() => toggleSetComplete(exerciseIdx, setIdx)}
                                    className="ms-2"
                                  />
                                </div>
                              ))}
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  const updated = [...sessionExercises]
                                  const lastSet = exercise.sets[exercise.sets.length - 1]
                                  const newSet: WorkoutSet = {
                                    id: randomUUID(),
                                    setNumber: exercise.sets.length + 1,
                                    weight: lastSet ? lastSet.weight : 0,
                                    reps: lastSet ? lastSet.reps : 0,
                                    isWarmup: false,
                                    completed: false
                                  }
                                  updated[exerciseIdx].sets.push(newSet)
                                  setSessionExercises(updated)
                                }}
                              >
                                + Add Set
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Session Notes - Moved to Bottom */}
                      <div className="mt-3 pt-3 border-top">
                        <label className="form-label fw-bold">Session Notes (Optional)</label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Add notes about this workout session..."
                          value={sessionNotes}
                          onChange={(e) => setSessionNotes(e.target.value)}
                        />
                      </div>

                      <div className="d-flex justify-content-center mt-auto pt-3 gap-2">
                        <button
                          className="btn btn-font btn-outline-danger btn-size"
                          onClick={handleCancelSession}
                        >
                          Cancel Session
                        </button>
                        {sessionExercises.length > 0 && (
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
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="container mt-4">
          <div className="row">
            <div className="col-12">
              <div className="card border-0">
                <div className="card-body">
                  <h5 className="mb-4">Workout History</h5>
                  {!user ? (
                    <Alert variant="info">
                      <p className="mb-0">Login to view your workout history.</p>
                    </Alert>
                  ) : completedSessions.length === 0 ? (
                    <Alert variant="info">
                      <p className="mb-0">No completed workout sessions yet.</p>
                    </Alert>
                  ) : (
                    (() => {
                      // Group sessions by date
                      const sessionsByDate: Record<string, any[]> = {}
                      completedSessions.forEach((session: any) => {
                        const date = new Date(session.start_time).toDateString()
                        if (!sessionsByDate[date]) {
                          sessionsByDate[date] = []
                        }
                        sessionsByDate[date].push(session)
                      })

                      // Sort dates descending (newest first)
                      const sortedDates = Object.keys(sessionsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

                      return (
                        <Accordion className="col-12" defaultActiveKey={sortedDates[0]}>
                          {sortedDates.map((date) => (
                            <Accordion.Item eventKey={date} key={date}>
                              <Accordion.Header>
                                <div className="d-flex justify-content-between align-items-center w-100">
                                  <span>
                                    <strong>
                                      {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </strong>
                                    {date === new Date().toDateString() && (
                                      <span className="badge bg-primary ms-2">Today</span>
                                    )}
                                    <span className="text-muted ms-3 small">
                                      {sessionsByDate[date].length} session{sessionsByDate[date].length !== 1 ? 's' : ''}
                                    </span>
                                  </span>
                                </div>
                              </Accordion.Header>
                              <Accordion.Body>
                                <Accordion flush>
                                  {sessionsByDate[date].map((session: any, idx: number) => (
                                    <Accordion.Item eventKey={`${date}-${idx}`} key={session.id}>
                                      <Accordion.Header className="bg-light border">
                                        <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                          <div>
                                            <strong>{session.name}</strong>
                                            <small className="text-muted ms-3">
                                              {new Date(session.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </small>
                                          </div>
                                          <Badge bg="primary">{formatDuration(session.duration_seconds)}</Badge>
                                        </div>
                                      </Accordion.Header>
                                      <Accordion.Body>
                                        {(() => {
                                          const parsedNotes = parseSessionNotes(session.notes)
                                          return parsedNotes && (
                                            <div className="mb-3 p-2 bg-light rounded">
                                              <small className="text-muted">Notes: {parsedNotes}</small>
                                            </div>
                                          )
                                        })()}
                                        {session.session_exercises && session.session_exercises.length > 0 && (
                                          <div className="list-group">
                                            {session.session_exercises.map((se: any) => (
                                              <div key={se.id} className="list-group-item">
                                                <div className="fw-bold">{se.exercises?.name || 'Exercise'}</div>
                                                <small className="text-muted">
                                                  {se.body_part} • {se.equipment}
                                                </small>
                                                {se.workout_sets && se.workout_sets.length > 0 && (
                                                  <div className="mt-2">
                                                    {se.workout_sets.map((set: any) => (
                                                      <div key={set.id} className="small text-muted">
                                                        Set {set.setNumber}: {set.weight} {se.weight_unit || 'lbs'} × {set.reps} reps
                                                        {set.is_warmup && <Badge bg="warning" className="ms-2">Warmup</Badge>}
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        <div className="mt-3 pt-3 border-top">
                                          <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleCopySession(session)}
                                          >
                                            <i className="bi bi-plus-circle"></i> Copy to Today
                                          </Button>
                                        </div>
                                      </Accordion.Body>
                                    </Accordion.Item>
                                  ))}
                                </Accordion>
                              </Accordion.Body>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      )
                    })()
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progressive Overload Tab */}
      {activeTab === 'progression' && (
        <div className="container mt-4">
          <div className="row">
            <div className="col-12">
              <div className="card border-0">
                <div className="card-body">
                  <h5 className="mb-4">Progressive Overload</h5>
                  {!user ? (
                    <Alert variant="info">
                      <p className="mb-0">Login to view your progressive overload data.</p>
                    </Alert>
                  ) : (
                    <>
                      <div className="mb-4">
                        <label className="form-label fw-bold">Select Exercise</label>
                        <Form.Select
                          value={selectedExerciseForProgression}
                          onChange={(e) => {
                            setSelectedExerciseForProgression(e.target.value)
                            fetchProgressiveOverload(e.target.value === 'all' ? undefined : e.target.value)
                          }}
                        >
                          <option value="all">All Exercises</option>
                          {Object.keys(previousWorkout || {}).map(exerciseName => (
                            <option key={exerciseName} value={exerciseName}>{exerciseName}</option>
                          ))}
                        </Form.Select>
                      </div>

                      {/* Suggested Challenge Card */}
                      {selectedExerciseForProgression !== 'all' && previousWorkout && previousWorkout[selectedExerciseForProgression] && (
                        <div className="mb-4 p-3 bg-success bg-opacity-10 border border-success rounded">
                          <h6 className="fw-bold text-success">🎯 Suggested Challenge</h6>
                          <div className="mb-2 text-muted small">Exercise: {selectedExerciseForProgression}</div>
                          {(() => {
                            const challenge = calculateSuggestedChallenge(selectedExerciseForProgression)
                            if (!challenge) return null
                            return (
                              <div>
                                <p className="mb-2">
                                  <strong>Last Session:</strong> {challenge.lastWeight} {weightUnit} × {challenge.lastReps} reps
                                </p>
                                <p className="mb-2">
                                  <strong>Target for Today:</strong> {challenge.suggestedWeight} {weightUnit} × {challenge.suggestedReps} reps
                                </p>
                                <p className="mb-0 text-muted small">
                                  💡 {challenge.recommendation}
                                </p>
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {progressiveOverloadData ? (
                        <div>
                          {progressiveOverloadData.currentPR && (
                            <div className="mb-4 p-3 bg-light rounded">
                              <h6 className="fw-bold">Current Personal Record</h6>
                              {progressiveOverloadData.currentPR.exerciseName && (
                                <p className="mb-2 text-muted small">Exercise: {progressiveOverloadData.currentPR.exerciseName}</p>
                              )}
                              <div className="d-flex gap-4">
                                <div>
                                  <small className="text-muted">Weight</small>
                                  <div className="fw-bold">{progressiveOverloadData.currentPR.weight} lbs</div>
                                </div>
                                <div>
                                  <small className="text-muted">Reps</small>
                                  <div className="fw-bold">{progressiveOverloadData.currentPR.reps}</div>
                                </div>
                                <div>
                                  <small className="text-muted">Volume</small>
                                  <div className="fw-bold">{progressiveOverloadData.currentPR.volume} lbs</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {progressiveOverloadData.metrics && progressiveOverloadData.metrics.length > 0 && (
                            <div className="mb-4">
                              <h6 className="fw-bold mb-3">Recent Sessions</h6>
                              <div className="list-group">
                                {progressiveOverloadData.metrics.map((metric: any, idx: number) => (
                                  <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                      <div className="fw-bold">{formatDate(metric.date)}</div>
                                      <small className="text-muted">
                                        {metric.exerciseName ? `${metric.exerciseName}: ` : ''}
                                        {metric.weight} lbs × {metric.reps} reps × {metric.sets} sets
                                      </small>
                                    </div>
                                    <Badge bg="info">{metric.volume} lbs volume</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {progressiveOverloadData.improvements && progressiveOverloadData.improvements.length > 0 && (
                            <div>
                              <h6 className="fw-bold mb-3">Progress</h6>
                              <div className="list-group">
                                {progressiveOverloadData.improvements.map((improvement: any, idx: number) => (
                                  <div key={idx} className="list-group-item">
                                    <div className="fw-bold">
                                      {formatDate(improvement.date)}
                                      {improvement.exerciseName && (
                                        <span className="text-muted ms-2">- {improvement.exerciseName}</span>
                                      )}
                                    </div>
                                    <div className="d-flex gap-3 mt-2">
                                      <div>
                                        <small className="text-muted">Weight Change</small>
                                        <div className={improvement.weightChange >= 0 ? 'text-success' : 'text-danger'}>
                                          {improvement.weightChange >= 0 ? '+' : ''}{improvement.weightChange} lbs
                                        </div>
                                      </div>
                                      <div>
                                        <small className="text-muted">Volume Change</small>
                                        <div className={improvement.volumeChange >= 0 ? 'text-success' : 'text-danger'}>
                                          {improvement.volumeChange >= 0 ? '+' : ''}{improvement.volumeChange} lbs
                                        </div>
                                      </div>
                                      <div>
                                        <small className="text-muted">Reps Change</small>
                                        <div className={improvement.repsChange >= 0 ? 'text-success' : 'text-danger'}>
                                          {improvement.repsChange >= 0 ? '+' : ''}{improvement.repsChange}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Alert variant="info">
                          <p className="mb-0">No progressive overload data available. Complete some workouts first!</p>
                        </Alert>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      <Modal show={showModal} size="lg" centered onHide={() => {
        setShowModal(false)
        setSelectedExercise(null)
        setSearchQuery('')
        setSearchResults([])
      }}>
        <Modal.Header className="border-0 mt-2 ms-3" closeButton>
          <Modal.Title>Add Exercise to Session</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="card mb-2 border-0">
            <div className="card-body">
              <div className="mb-3 position-relative">
                <label htmlFor="exerciseName" className="form-label">Exercise Name</label>
                <input
                  type="text"
                  className="form-control border-0 border-bottom"
                  id="exerciseName"
                  name="exerciseName"
                  placeholder="Search exercises or type custom name..."
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
              {!selectedExercise && searchQuery && (
                <div className="mb-3 p-2 bg-warning bg-opacity-10 border border-warning rounded">
                  <small className="text-muted">
                    <strong>Tip:</strong> Type a custom exercise name if not found in the database
                  </small>
                </div>
              )}
            </div>
          </div>
          <div className="text-center">
            <button
              type="button"
              className="btn btn-font btn-primary mt-3 mb-2"
              style={{ padding: '10px 20px', fontSize: '16px' }}
              onClick={handleAddExerciseToSession}
            >
              Add Exercise
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  )
}

export default WorkoutPage
