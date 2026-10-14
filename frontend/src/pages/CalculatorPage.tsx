import { useState } from 'react'
import { calculatorService } from '../services/api'
import 'bootstrap/dist/css/bootstrap.min.css'
import '../App.css'

interface CalculatorResult {
  bmi: number
  category: string
  riskLevel: string
  metrics: {
    inputWeightKg: number
    inputHeightCm: number
    healthyWeightRangeKg: {
      min: number
      max: number
    }
    estimatedBmrCalories: number
    estimatedTdeeCalories: number
  }
  caloricGuidelines: {
    fatLossCutting: number
    weightMaintenance: number
    leanMuscleBulking: number
  }
  recommendations: string[]
}

function CalculatorPage() {
  const [weightKg, setWeightKg] = useState(78)
  const [heightCm, setHeightCm] = useState(178)
  const [age, setAge] = useState(27)
  const [gender, setGender] = useState('male')
  const [activityLevel, setActivityLevel] = useState('moderate')
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await calculatorService.calculateBmi({
        weightKg,
        heightCm,
        age,
        gender,
        activityLevel,
      })

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'Failed to calculate BMI')
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getBmiColor = (category: string) => {
    if (category.includes('Underweight')) return 'text-warning'
    if (category.includes('Normal')) return 'text-success'
    if (category.includes('Overweight')) return 'text-warning'
    if (category.includes('Obese')) return 'text-danger'
    return 'text-primary'
  }

  return (
    <>
      <div className="container-fluid py-3 px-5">
        <div className="row align-items-center">
          <div className="col-4">
            <h1 className="mb-0 bbh-bartle-regular">BMI Calculator</h1>
          </div>
          <div className="col-8">
            <div className="row">
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-4">
        <div className="row">
          <div className="col-md-6">
            <div className="card border-0 mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4 finlandica-text-regular">Enter Your Details</h5>
                <form onSubmit={handleCalculate}>
                  <div className="mb-3">
                    <label htmlFor="weight" className="form-label">Weight (kg)</label>
                    <input
                      type="number"
                      className="form-control border-0 border-bottom"
                      id="weight"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      step="0.1"
                      min="20"
                      max="350"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="height" className="form-label">Height (cm)</label>
                    <input
                      type="number"
                      className="form-control border-0 border-bottom"
                      id="height"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      step="0.1"
                      min="50"
                      max="260"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="age" className="form-label">Age</label>
                    <input
                      type="number"
                      className="form-control border-0 border-bottom"
                      id="age"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      min="1"
                      max="120"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="gender" className="form-label">Gender</label>
                    <select
                      className="form-select border-0 border-bottom"
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="activity" className="form-label">Activity Level</label>
                    <select
                      className="form-select border-0 border-bottom"
                      id="activity"
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(e.target.value)}
                      required
                    >
                      <option value="sedentary">Sedentary (little or no exercise)</option>
                      <option value="light">Light (exercise 1-3 days/week)</option>
                      <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                      <option value="active">Active (exercise 6-7 days/week)</option>
                      <option value="athlete">Athlete (very hard exercise & physical job)</option>
                    </select>
                  </div>

                  {error && (
                    <div className="alert alert-danger mb-3">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-100 btn-font"
                    disabled={loading}
                  >
                    {loading ? 'Calculating...' : 'Calculate BMI'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            {result ? (
              <div className="card border-0 mb-4">
                <div className="card-body">
                  <h5 className="card-title mb-4 finlandica-text-regular">Your Results</h5>

                  <div className="text-center mb-4">
                    <h2 className={`display-4 fw-bold ${getBmiColor(result.category)}`}>
                      {result.bmi}
                    </h2>
                    <p className={`fw-bold ${getBmiColor(result.category)}`}>
                      {result.category}
                    </p>
                    <small className="text-muted">{result.riskLevel}</small>
                  </div>

                  <div className="row mb-4">
                    <div className="col-6 mb-3">
                      <div className="p-3 bg-light rounded">
                        <h6 className="mb-1">Healthy Weight Range</h6>
                        <p className="mb-0 text-fonts">
                          {result.metrics.healthyWeightRangeKg.min} - {result.metrics.healthyWeightRangeKg.max} kg
                        </p>
                      </div>
                    </div>
                    <div className="col-6 mb-3">
                      <div className="p-3 bg-light rounded">
                        <h6 className="mb-1">BMR (Basal)</h6>
                        <p className="mb-0 text-fonts">{result.metrics.estimatedBmrCalories} kcal/day</p>
                      </div>
                    </div>
                    <div className="col-6 mb-3">
                      <div className="p-3 bg-light rounded">
                        <h6 className="mb-1">TDEE (Total)</h6>
                        <p className="mb-0 text-fonts">{result.metrics.estimatedTdeeCalories} kcal/day</p>
                      </div>
                    </div>
                    <div className="col-6 mb-3">
                      <div className="p-3 bg-light rounded">
                        <h6 className="mb-1">Maintenance</h6>
                        <p className="mb-0 text-fonts">{result.caloricGuidelines.weightMaintenance} kcal/day</p>
                      </div>
                    </div>
                  </div>

                  <div className="card border-0 bg-light mb-3">
                    <div className="card-body">
                      <h6 className="card-title mb-3">Caloric Guidelines</h6>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-fonts">Fat Loss:</span>
                        <strong className="text-warning">{result.caloricGuidelines.fatLossCutting} kcal</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-fonts">Maintenance:</span>
                        <strong className="text-success">{result.caloricGuidelines.weightMaintenance} kcal</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-fonts">Muscle Gain:</span>
                        <strong className="text-primary">{result.caloricGuidelines.leanMuscleBulking} kcal</strong>
                      </div>
                    </div>
                  </div>

                  {result.recommendations.length > 0 && (
                    <div className="card border-0 bg-light">
                      <div className="card-body">
                        <h6 className="card-title mb-3">Recommendations</h6>
                        <ul className="mb-0 text-fonts">
                          {result.recommendations.map((rec, index) => (
                            <li key={index} className="mb-2">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card border-0 mb-4">
                <div className="card-body text-center py-5">
                  <h5 className="text-muted">Enter your details and click "Calculate BMI" to see your results</h5>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default CalculatorPage
