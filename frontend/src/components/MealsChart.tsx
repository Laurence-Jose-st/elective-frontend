import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import '../App.css'

interface MealsChartProps {
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
}

const DAILY_TARGETS = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fats: 70,
  fiber: 30
}

function MacroDonutChart({ data, title, unit, colors }: { data: any[], title: string, unit: string, colors: string[] }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h5 className="meals-chart-title">{title}</h5>
      <div style={{ width: '100%', height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ value }) => `${value}${unit}`}
              outerRadius={50}
              fill="#8884d8"
              dataKey="value"
              innerRadius={35}
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function MealsChart({ calories, protein, carbs, fats, fiber }: MealsChartProps) {
  const caloriesData = [
    { name: 'Consumed', value: calories },
    { name: 'Remaining', value: Math.max(0, DAILY_TARGETS.calories - calories) },
  ]

  const proteinData = [
    { name: 'Consumed', value: protein },
    { name: 'Remaining', value: Math.max(0, DAILY_TARGETS.protein - protein) },
  ]

  const carbsData = [
    { name: 'Consumed', value: carbs },
    { name: 'Remaining', value: Math.max(0, DAILY_TARGETS.carbs - carbs) },
  ]

  const fatsData = [
    { name: 'Consumed', value: fats },
    { name: 'Remaining', value: Math.max(0, DAILY_TARGETS.fats - fats) },
  ]

  const fiberData = [
    { name: 'Consumed', value: fiber },
    { name: 'Remaining', value: Math.max(0, DAILY_TARGETS.fiber - fiber) },
  ]

  return (
    <div className="meals-chart-container">
      <div className="meals-chart-item meals-chart-item-purple">
        <MacroDonutChart data={caloriesData} title="Calories" unit="kcal" colors={['purple', '#E0E0E0']} />
      </div>
      <div className="meals-chart-item meals-chart-item-blue">
        <MacroDonutChart data={proteinData} title="Protein" unit="g" colors={['blue', '#E0E0E0']} />
      </div>
      <div className="meals-chart-item meals-chart-item-orange">
        <MacroDonutChart data={carbsData} title="Carbs" unit="g" colors={['orange', '#E0E0E0']} />
      </div>
      <div className="meals-chart-item meals-chart-item-red">
        <MacroDonutChart data={fatsData} title="Fats" unit="g" colors={['red', '#E0E0E0']} />
      </div>
      <div className="meals-chart-item meals-chart-item-green">
        <MacroDonutChart data={fiberData} title="Fiber" unit="g" colors={['green', '#E0E0E0']} />
      </div>
    </div>
  )
}

export default MealsChart
