import 'bootstrap/dist/css/bootstrap.min.css'
import { Carousel } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import WorkoutCharts from '../components/WorkoutCharts'
import { workoutService, mealService } from '../services/api'
import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import '../App.css'

function Dashboard() {
  const { user } = useAuth()
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const [dailyStats, setDailyStats] = useState({
    exercises: 0,
    totalSets: 0,
    totalReps: 0,
    totalWeight: 0,
    totalDuration: 0
  })
  const [nutritionStats, setNutritionStats] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0
  })
  const [progressiveData, setProgressiveData] = useState<any>(null)
  const [todayMeals, setTodayMeals] = useState<any[]>([])
  const [todayWorkouts, setTodayWorkouts] = useState<any[]>([])

  useEffect(() => {
    fetchDailyStats()
    fetchNutritionStats()
    fetchProgressiveData()
  }, [])

  const fetchDailyStats = async () => {
    try {
      const workouts = await workoutService.getWorkouts()
      const today = new Date().toDateString()

      const todayWorkoutsFiltered = workouts.filter((w: any) => {
        return new Date(w.created_at).toDateString() === today
      })

      setTodayWorkouts(todayWorkoutsFiltered)

      const stats = todayWorkoutsFiltered.reduce((acc: any, w: any) => {
        acc.exercises += 1
        acc.totalReps += w.reps || 0
        acc.totalWeight += w.weight || 0
        acc.totalDuration += w.duration || 0
        acc.totalSets += w.sets || 3 // Use sets from data or default to 3
        return acc
      }, { exercises: 0, totalSets: 0, totalReps: 0, totalWeight: 0, totalDuration: 0 })

      setDailyStats(stats)
    } catch (error) {
      console.error('Error fetching daily stats:', error)
      // Keep stats at 0 for guests
    }
  }

  const fetchNutritionStats = async () => {
    try {
      const response = await mealService.getMeals()
      const meals = response.data || []
      const today = new Date().toDateString()

      const todayMealsFiltered = meals.filter((m: any) => {
        return new Date(m.created_at).toDateString() === today
      })

      setTodayMeals(todayMealsFiltered)

      const stats = todayMealsFiltered.reduce((acc: any, m: any) => {
        acc.calories += m.calories || 0
        acc.protein += m.protein || 0
        acc.carbs += m.carbs || 0
        acc.fats += m.fats || 0
        acc.fiber += m.fiber || 0
        return acc
      }, { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 })

      setNutritionStats({
        calories: Math.round(stats.calories),
        protein: Math.round(stats.protein),
        carbs: Math.round(stats.carbs),
        fats: Math.round(stats.fats),
        fiber: Math.round(stats.fiber)
      })
    } catch (error) {
      console.error('Error fetching nutrition stats:', error)
      // Keep stats at 0 for guests
    }
  }

  const fetchProgressiveData = async () => {
    if (!user) return
    try {
      // Fetch all exercises data for dashboard
      const response = await workoutService.getProgressiveOverload('all')
      setProgressiveData(response.data)
    } catch (error) {
      console.error('Error fetching progressive data:', error)
    }
  }

  return (
    <>
      <div className="container-fluid py-3 px-5">
        <div className="row align-items-center mt-2">
          <div className="col-4">
            <h1 className="mb-0 bbh-bartle-regular text-pure-white">Dashboard</h1>
          </div>
          <div className="col-8">
            <Navigation />
          </div>
        </div>
      </div>

      <div className="container mt-3">
        <div className="row">
          <div className="col-12">
            <p className="mb-0 finlandica-text-regular text-off-white">{currentDate}</p>
            <h5 className=" card-title mb-4 finlandica-text-regular text-pure-white">Welcome, {user?.username || 'User'}!</h5>

            <div className="card border-0 mb-4 bg-slate-900 border border-slate-800">
              <div className="card-body">
                <Carousel interval={5000} controls={true}>
                  <Carousel.Item>
                    <div className="p-4 bg-slate-900 rounded-0" style={{ height: '400px' }}>
                      <h3 className="text-center mb-4 finlandica-text-regular text-pure-white">Weekly Performance</h3>
                      <WorkoutCharts />
                    </div>
                  </Carousel.Item>

                  <Carousel.Item>
                    <div className="p-4 bg-slate-900 text-fonts text-pure-white rounded-0 d-flex flex-column" style={{ height: '400px' }}>
                      <h3 className="text-center mb-4 finlandica-text-regular text-pure-white">Workout Progress</h3>
                      {progressiveData ? (
                        <div className="row g-3 align-items-center flex-grow-1">
                          {/* Card 1: Personal Record */}
                          <div className="col-4">
                            <div className="p-4 bg-slate-800 rounded border border-emerald-500/30 h-100 d-flex flex-column justify-content-center" style={{ minHeight: '180px' }}>
                              <h6 className="fw-bold mb-2 small text-neon-green text-fonts">PR</h6>
                              {progressiveData.currentPR && (
                                <>
                                  {progressiveData.currentPR.exerciseName && (
                                    <p className="mb-1 text-pure-white" style={{ fontSize: '0.75rem' }}>{progressiveData.currentPR.exerciseName}</p>
                                  )}
                                  <p className="mb-1 fw-bold text-pure-white text-fonts" style={{ fontSize: '2rem' }}>
                                    {progressiveData.currentPR.weight} lbs × {progressiveData.currentPR.reps} reps
                                  </p>
                                  <small className="text-slate-300" style={{ fontSize: '0.7rem' }}>Vol: {progressiveData.currentPR.volume} lbs</small>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Card 2: Next Goal */}
                          <div className="col-4">
                            <div className="p-4 bg-slate-800 rounded border border-emerald-500/30 h-100 d-flex flex-column justify-content-center" style={{ minHeight: '180px' }}>
                              <h6 className="fw-bold mb-2 small text-neon-green text-fonts">Next Goal</h6>
                              {progressiveData.improvements && progressiveData.improvements.length > 0 ? (
                                (() => {
                                  const weightChange = progressiveData.improvements[0].weightChange
                                  if (weightChange === 0) {
                                    return (
                                      <>
                                        <p className="mb-1 fw-bold text-pure-white text-fonts" style={{ fontSize: '2rem' }}>Increase reps</p>
                                        <small className="text-slate-300" style={{ fontSize: '0.7rem' }}>at current weight</small>
                                      </>
                                    )
                                  } else {
                                    return (
                                      <>
                                        <p className="mb-1 fw-bold text-pure-white text-fonts" style={{ fontSize: '2rem' }}>
                                          {weightChange >= 0 ? '+' : ''}{weightChange} lbs
                                        </p>
                                        <small className="text-slate-300" style={{ fontSize: '0.7rem' }}>progression</small>
                                      </>
                                    )
                                  }
                                })()
                              ) : (
                                <p className="mb-0 text-slate-300" style={{ fontSize: '0.8rem' }}>Start logging workouts</p>
                              )}
                            </div>
                          </div>

                          {/* Card 3: Recent Session */}
                          <div className="col-4">
                            <div className="p-4 bg-slate-800 rounded border border-emerald-500/30 h-100 d-flex flex-column justify-content-center" style={{ minHeight: '180px' }}>
                              <h6 className="fw-bold mb-2 small text-neon-green text-fonts">Recent</h6>
                              {progressiveData.metrics && progressiveData.metrics.length > 0 ? (
                                <>
                                  {progressiveData.metrics[0].exerciseName && (
                                    <p className="mb-1 text-pure-white" style={{ fontSize: '0.75rem' }}>{progressiveData.metrics[0].exerciseName}</p>
                                  )}
                                  <p className="mb-1 fw-bold text-pure-white text-fonts" style={{ fontSize: '2rem' }}>
                                    {progressiveData.metrics[0].weight} lbs × {progressiveData.metrics[0].reps} reps
                                  </p>
                                  <small className="text-slate-300" style={{ fontSize: '0.7rem' }}>
                                    {progressiveData.metrics[0].sets} sets × {progressiveData.metrics[0].volume} lbs vol
                                  </small>
                                </>
                              ) : (
                                <p className="mb-0 text-slate-300" style={{ fontSize: '0.8rem' }}>No sessions yet</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 text-center text-slate-300">Start logging workouts to see your progress!</p>
                      )}
                    </div>
                  </Carousel.Item>
                  <Carousel.Item>
                    <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-0 d-flex flex-column" style={{ height: '400px' }}>
                      <h3 className="text-center mb-4 text-fonts text-pure-white">Today's Meal Diary</h3>
                      {todayMeals.length > 0 ? (
                        <div className="row g-2 flex-grow-1" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                          {todayMeals.slice(0, 6).map((meal: any, idx: number) => (
                            <div key={idx} className="col-6">
                              <div className="p-2 bg-slate-800 rounded border border-slate-700">
                                <p className="mb-1 fw-bold text-pure-white" style={{ fontSize: '0.8rem' }}>{meal.food_name}</p>
                                <small className="text-slate-300" style={{ fontSize: '0.7rem' }}>
                                  {meal.meal_type} • {meal.calories} kcal
                                </small>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-center text-slate-300" style={{ fontSize: '0.9rem' }}>
                          No meals logged today. Start tracking your nutrition!
                        </p>
                      )}
                    </div>
                  </Carousel.Item>
                </Carousel>
              </div>
            </div>

            <div className="row">
              <div className="col-6">
                <div className="card border-0 rounded-2 mb-4 bg-slate-900 border border-slate-800">
                  <div className="card-body">

                    <h5 className="card-title mb-4 text-bold finlandica-text-regular text-pure-white">Daily Performance</h5>
                    <div className="row">
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-slate-800 rounded border border-slate-700">
                          <h3 className="mb-1 text-pure-white">{dailyStats.exercises}</h3>
                          <small className="text-fonts text-slate-300">Exercises</small>
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-slate-800 rounded border border-slate-700">
                          <h3 className="mb-1 text-pure-white">{dailyStats.totalSets}</h3>
                          <small className="text-fonts text-slate-300">Total Sets</small>
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-slate-800 rounded border border-slate-700">
                          <h3 className="mb-1 text-pure-white">{dailyStats.totalReps}</h3>
                          <small className="text-fonts text-slate-300">Total Reps</small>
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-slate-800 rounded border border-slate-700">
                          <h3 className="mb-1 text-pure-white">{dailyStats.totalWeight} lbs</h3>
                          <small className="text-fonts text-slate-300">Total Weight</small>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="p-3 bg-slate-800 rounded border border-slate-700">
                          <h3 className="mb-1 text-pure-white">{dailyStats.totalDuration} min</h3>
                          <small className="text-fonts text-slate-300">Active Duration</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <div className="col-6">
                <div className="card border-0 mb-4 bg-slate-900 border border-slate-800">
                  <div className="card-body">
                    <h5 className="card-title mb-4 finlandica-text-regular text-pure-white">Nutrition Summary</h5>
                    <div className="row">
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-slate-800 rounded border border-slate-700">
                          <h3 className="mb-1 text-pure-white">{nutritionStats.calories}</h3>
                          <small className="text-fonts text-slate-300">Calories (kcal)</small>
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-slate-800 rounded border border-slate-700">
                          <h3 className="mb-1 text-pure-white">{nutritionStats.protein}g</h3>
                          <small className="text-fonts text-slate-300">Protein</small>
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-slate-800 rounded border border-slate-700">
                          <h3 className="mb-1 text-pure-white">{nutritionStats.carbs}g</h3>
                          <small className="text-fonts text-slate-300">Carbohydrates</small>
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-slate-800 rounded border border-slate-700">
                          <h3 className="mb-1 text-pure-white">{nutritionStats.fats}g</h3>
                          <small className="text-fonts text-slate-300">Fats</small>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="p-3 bg-slate-800 rounded border border-slate-700">
                          <h3 className="mb-1 text-pure-white">{nutritionStats.fiber}g</h3>
                          <small className="text-fonts text-off-white">Dietary Fiber</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-charcoal border-0 mb-4">
              <div className="card-body rounded-4">
                <h5 className="card-title ms-3 mt-3 mb-4 finlandica-text-regular text-off-white">Target Progress</h5>
                {todayWorkouts.length === 0 ? (
                  <div className="alert bg-charcoal mb-0">
                    <h6 className="alert-heading text-pure-white">Ready to Lift?</h6>
                    <p className="mb-2 text-off-white">You haven't logged a workout today. Start your session now to track your progress!</p>
                    <button
                      className="btn btn-font font-bold bg-neon-yellow btn-md mt-2"
                   
                      onClick={() => window.location.href = '/workout'}
                    >
                      Start Workout
                    </button>
                  </div>
                ) : (
                  <div className="alert alert-success mb-0">
                    <h6 className="alert-heading">✅ Great Job!</h6>
                    <p className="mb-0">You've logged {todayWorkouts.length} workout(s) today. Keep up the momentum!</p>
                  </div>
                )}
              </div>
            </div>


          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
