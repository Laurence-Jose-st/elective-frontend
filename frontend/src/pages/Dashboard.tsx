import 'bootstrap/dist/css/bootstrap.min.css'
import Navigation from '../components/Navigation'
import { Carousel } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import WorkoutCharts from '../components/WorkoutCharts'
import { workoutService, mealService } from '../services/api'
import { useState, useEffect } from 'react'
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

  useEffect(() => {
    fetchDailyStats()
    fetchNutritionStats()
  }, [])

  const fetchDailyStats = async () => {
    try {
      const workouts = await workoutService.getWorkouts()
      const today = new Date().toDateString()

      const todayWorkouts = workouts.filter((w: any) => {
        return new Date(w.created_at).toDateString() === today
      })

      const stats = todayWorkouts.reduce((acc: any, w: any) => {
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
    }
  }

  const fetchNutritionStats = async () => {
    try {
      const response = await mealService.getMeals()
      const meals = response.data || []
      const today = new Date().toDateString()

      const todayMeals = meals.filter((m: any) => {
        return new Date(m.created_at).toDateString() === today
      })

      const stats = todayMeals.reduce((acc: any, m: any) => {
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
    }
  }

  return (
    <>
      <div className="container-fluid py-3 px-5">
        <div className="row align-items-center">
          <div className="col-4">
            <h1 className="mb-0 bbh-bartle-regular">Dashboard</h1>
          </div>
          <div className="col-8">
            <div className="row">
              <Navigation />
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-3">
        <div className="row">
          <div className="col-12">
            <p className="mb-0 finlandica-text-regular text-muted">{currentDate}</p>
            <h5 className=" card-title mb-4 finlandica-text-regular">Welcome, {user?.username || 'User'}!</h5>

            <div className="card border-0 mb-4">
              <div className="card-body">
                <Carousel interval={5000} controls={false}>
                  <Carousel.Item>
                    <div className="p-4 bg-light rounded-0" style={{ height: '350px' }}>
                      <h3 className="text-center mb-4 finlandica-text-regular">Weekly Performance</h3>
                      <WorkoutCharts />
                    </div>
                  </Carousel.Item>

                  <Carousel.Item>
                    <div className="p-4 text-center bg-primary text-white rounded-0" style={{ height: '350px' }}>
                      <h3>Workout</h3>
                      <p>Updates goes here.</p>
                    </div>
                  </Carousel.Item>
                  <Carousel.Item>
                    <div className="p-4 text-center bg-primary text-white rounded-0" style={{ height: '350px' }}>
                      <h3>Meals</h3>
                      <p>Updates goes here.</p>
                    </div>
                  </Carousel.Item>
                </Carousel>
              </div>
            </div>

            <div className="row">
              <div className="col-6">
                <div className="card mb-4">
                  <div className="card-body">

                    <h5 className="card-title mb-4 finlandica-text-regular">Daily Performance</h5>
                    <div className="row">
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-light rounded">
                          <h3 className="mb-1">{dailyStats.exercises}</h3>
                          <small className="text-fonts text-muted">Exercises</small>
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-light rounded">
                          <h3 className="mb-1">{dailyStats.totalSets}</h3>
                          <small className="text-fonts text-muted">Total Sets</small>
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-light rounded">
                          <h3 className="mb-1">{dailyStats.totalReps}</h3>
                          <small className="text-fonts text-muted">Total Reps</small>
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-light rounded">
                          <h3 className="mb-1">{dailyStats.totalWeight} lbs</h3>
                          <small className="text-fonts text-muted">Total Weight</small>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="p-3 bg-light rounded">
                          <h3 className="mb-1">{dailyStats.totalDuration} min</h3>
                          <small className="text-fonts text-muted">Active Duration</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <div className="col-6">
                <div className="card mb-4">
                  <div className="card-body">
                    <h5 className="card-title mb-4 finlandica-text-regular">Nutrition Summary</h5>
                    <div className="row">
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-light rounded">
                          <h3 className="mb-1">{nutritionStats.calories}</h3>
                          <small className="text-fonts text-muted">Calories (kcal)</small>
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-light rounded">
                          <h3 className="mb-1">{nutritionStats.protein}g</h3>
                          <small className="text-fonts text-muted">Protein</small>
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-light rounded">
                          <h3 className="mb-1">{nutritionStats.carbs}g</h3>
                          <small className="text-fonts text-muted">Carbohydrates</small>
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="p-3 bg-light rounded">
                          <h3 className="mb-1">{nutritionStats.fats}g</h3>
                          <small className="text-fonts text-muted">Fats</small>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="p-3 bg-light rounded">
                          <h3 className="mb-1">{nutritionStats.fiber}g</h3>
                          <small className="text-fonts text-muted">Dietary Fiber</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4 finlandica-text-regular">Target Progress</h5>
                <p className="card-text">Card content goes here.</p>
              </div>
            </div>


          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
