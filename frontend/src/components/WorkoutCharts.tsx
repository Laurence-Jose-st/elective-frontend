import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { workoutService } from '../services/api'

interface DailyActivity {
  date: string
  exercises: number
}

interface WorkoutChartsProps {
  refreshTrigger?: number
}

function WorkoutCharts({ refreshTrigger = 0 }: WorkoutChartsProps) {
  const [chartData, setChartData] = useState<DailyActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWorkoutData = async () => {
      try {
        const workouts = await workoutService.getWorkouts()

        // Group workouts by date and count exercises
        const dailyCounts = workouts.reduce((acc: Record<string, number>, workout: any) => {
          const date = new Date(workout.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          acc[date] = (acc[date] || 0) + 1
          return acc
        }, {})

        // Get last 7 days of data
        const last7Days: DailyActivity[] = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          last7Days.push({
            date: dateStr,
            exercises: dailyCounts[dateStr] || 0
          })
        }

        setChartData(last7Days)
      } catch (error) {
        console.error('Error fetching workout data:', error)
        setChartData([])
      } finally {
        setLoading(false)
      }
    }

    fetchWorkoutData()
  }, [refreshTrigger])

  if (loading) {
    return (
      <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading workout data...</p>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-off-white">No workout data available. Start logging your workouts!</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="exercises" fill="#CEFE46" name="Exercises Done" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WorkoutCharts
