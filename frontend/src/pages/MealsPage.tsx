import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Modal } from 'react-bootstrap'
import MealsChart from '../components/MealsChart'
import { mealService } from '../services/api'
import '../App.css'

interface FoodItem {
  id: number
  name: string
  category: string
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
}

function MealsPage() {
    const [showModal, setShowModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<FoodItem[]>([])
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [mealCategory, setMealCategory] = useState('lunch')
    const [loggedMeals, setLoggedMeals] = useState<any[]>([])
    const [dailyTotals, setDailyTotals] = useState({
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        fiber: 0
    })
    const [formValues, setFormValues] = useState({
        portionWeight: 100,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        fiber: 0
    })

    useEffect(() => {
        fetchLoggedMeals()
    }, [])

    const fetchLoggedMeals = async () => {
        try {
            const response = await mealService.getMeals()
            const meals = response.data || []
            setLoggedMeals(meals)
            calculateDailyTotals(meals)
        } catch (error) {
            console.error('Error fetching meals:', error)
        }
    }

    const calculateDailyTotals = (meals: any[]) => {
        const today = new Date().toDateString()
        const todayMeals = meals.filter((meal: any) => new Date(meal.created_at).toDateString() === today)

        const totals = todayMeals.reduce((acc, meal) => {
            acc.calories += meal.calories || 0
            acc.protein += meal.protein || 0
            acc.carbs += meal.carbs || 0
            acc.fats += meal.fats || 0
            acc.fiber += meal.fiber || 0
            return acc
        }, { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 })

        setDailyTotals({
            calories: Math.round(totals.calories),
            protein: Math.round(totals.protein),
            carbs: Math.round(totals.carbs),
            fats: Math.round(totals.fats),
            fiber: Math.round(totals.fiber)
        })
    }

    const handleSearch = async (query: string) => {
        setSearchQuery(query)
        if (query.length < 2) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        try {
            const response = await mealService.searchFoodItems(query)
            setSearchResults(response.data || [])
        } catch (error) {
            console.error('Search error:', error)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    const handleFoodSelect = (food: FoodItem) => {
        setSelectedFood(food)
        setSearchQuery(food.name)
        setSearchResults([])

        // Auto-fill form with food data (based on 100g serving)
        setFormValues({
            portionWeight: 100,
            calories: Math.round(food.calories),
            protein: Math.round(food.protein),
            carbs: Math.round(food.carbs),
            fats: Math.round(food.fats),
            fiber: Math.round(food.fiber)
        })
    }

    const handlePortionChange = (weight: number) => {
        if (!selectedFood) return

        const ratio = weight / 100
        setFormValues({
            portionWeight: weight,
            calories: Math.round(selectedFood.calories * ratio),
            protein: Math.round(selectedFood.protein * ratio),
            carbs: Math.round(selectedFood.carbs * ratio),
            fats: Math.round(selectedFood.fats * ratio),
            fiber: Math.round(selectedFood.fiber * ratio)
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const mealData = {
            mealName: selectedFood?.name || 'Custom Meal',
            mealType: mealCategory,
            calories: formValues.calories,
            proteinGrams: formValues.protein,
            fiberGrams: formValues.fiber,
            carbsGrams: formValues.carbs,
            fatsGrams: formValues.fats
        }

        try {
            await mealService.createMeal(mealData)
            setShowModal(false)
            setSelectedFood(null)
            setSearchQuery('')
            setSearchResults([])
            setFormValues({
                portionWeight: 100,
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0,
                fiber: 0
            })
            await fetchLoggedMeals()
        } catch (error) {
            console.error('Error logging meal:', error)
            alert('Failed to log meal')
        }
    }

    const handleDeleteMeal = async (id: number) => {
        try {
            await mealService.deleteMeal(id)
            await fetchLoggedMeals()
        } catch (error) {
            console.error('Error deleting meal:', error)
            alert('Failed to delete meal')
        }
    }
    return (
        <>
            <div className="container-fluid py-3 px-5">
                <div className="row align-items-center">
                    <div className="col-4">
                        <h1 className="mb-0 bbh-bartle-regular">Meal</h1>
                    </div>
                    <div className="col-8">
                        <div className="row">
                            <Navigation />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mt-4">
                <div className="row">
                    <div className="col-12 ">
                        <h2 className="mb-4">Nutrition Overview</h2>
                        <MealsChart
                            calories={dailyTotals.calories}
                            protein={dailyTotals.protein}
                            carbs={dailyTotals.carbs}
                            fats={dailyTotals.fats}
                            fiber={dailyTotals.fiber}
                        />
                    </div>
                </div>
            </div>





            <div className="container mt-4">
                <div className="card">
                    <div className="card-body">
                        <div className="row mb-3">
                            <div className="col-6">
                                <h2>Meal Diary</h2>
                            </div>
                            <div className="col-6 text-end">
                                <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
                                    <i className="bi bi-plus-lg"></i>
                                    <span>Log Meal</span>
                                </button>
                            </div>
                        </div>

                        <div className="row">
                            {['breakfast', 'lunch', 'dinner', 'snack'].map((category) => {
                                const categoryMeals = loggedMeals.filter((meal: any) => {
                                    const mealDate = new Date(meal.created_at).toDateString()
                                    const today = new Date().toDateString()
                                    return mealDate === today && meal.meal_type === category
                                })

                                if (categoryMeals.length === 0) return null

                                return (
                                    <div key={category} className="col-12 mb-3">
                                        <h5 className="text-capitalize mb-2">{category}</h5>
                                        {categoryMeals.map((meal: any) => (
                                            <div key={meal.id} className="card mb-2 border-0 bg-light">
                                                <div className="card-body py-2">
                                                    <div className="d-flex text-fonts justify-content-between align-items-center">
                                                        <div>
                                                            <strong>{meal.food_name}</strong>
                                                            <small className="text-fonts text-muted d-block">
                                                                {meal.calories} kcal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g
                                                            </small>
                                                        </div>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDeleteMeal(meal.id)}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })}
                            {loggedMeals.filter((meal: any) => new Date(meal.created_at).toDateString() === new Date().toDateString()).length === 0 && (
                                <div className="col-12 text-center text-muted py-4">
                                    No meals logged today. Click "Log Meal" to add your first meal.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={showModal} size="lg" centered onHide={() => {
                setShowModal(false)
                setSelectedFood(null)
                setSearchQuery('')
                setSearchResults([])
                setFormValues({
                    portionWeight: 100,
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fats: 0,
                    fiber: 0
                })
            }}>
                <Modal.Header className="border-0" closeButton>
                    <Modal.Title>Add Meal</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3 position-relative">
                            <input
                                type="text"
                                className="form-control border-0 border-bottom"
                                placeholder="Search meals..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                autoComplete="off"
                            />
                            {searchResults.length > 0 && (
                                <div className="position-absolute w-100 bg-white border rounded shadow-lg mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                    {searchResults.map((food) => (
                                        <div
                                            key={food.id}
                                            className="p-2 search-result-item"
                                            onClick={() => handleFoodSelect(food)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="text-fonts fw-bold">{food.name}</div>
                                            <small className="text-fonts text-muted">
                                                {food.category} • {Math.round(food.calories)} kcal per 100g
                                            </small>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isSearching && (
                                <div className="position-absolute w-100 bg-white border rounded shadow-lg mt-1 p-2 text-fonts text-muted" style={{ zIndex: 1000 }}>
                                    Searching...
                                </div>
                            )}
                        </div>
                        {selectedFood && (
                            <div className="mb-3 p-2 bg-light rounded">
                                <small className="text-fonts text-muted">
                                    <strong>Selected:</strong> {selectedFood.name} ({selectedFood.category})
                                </small>
                            </div>
                        )}
                        <div className="mb-4">
                            <div className="card border-0">
                                <div className="card-body">
                                    <label className="form-label">Portion Weight (grams)</label>
                                    <div className="">
                                        <div className="d-flex gap-2 align-items-center">
                                            <input
                                                type="number"
                                                className="form-control border-0 border-bottom"
                                                value={formValues.portionWeight}
                                                onChange={(e) => handlePortionChange(Number(e.target.value))}
                                                style={{ width: '150px' }}
                                            />
                                            <span>grams</span>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card border-0">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-6 mb-3">
                                        <div className="mb-3">
                                            <label htmlFor="mealCategory" className="form-label">Meal Category</label>
                                            <select
                                                className="form-select border-0 border-bottom"
                                                id="mealCategory"
                                                value={mealCategory}
                                                onChange={(e) => setMealCategory(e.target.value)}
                                            >
                                                <option value="breakfast">Breakfast</option>
                                                <option value="lunch">Lunch</option>
                                                <option value="dinner">Dinner</option>
                                                <option value="snack">Snack</option>
                                            </select>
                                        </div>

                                    </div>
                                    <div className="col-6 mb-3">
                                        <label htmlFor="calories" className="form-label" style={{ color: 'purple' }}>Total Calories (kcal)</label>
                                        <input
                                            type="number"
                                            className="form-control border-0 border-bottom"
                                            style={{ color: 'purple' }}
                                            id="calories"
                                            value={formValues.calories}
                                            onChange={(e) => setFormValues({ ...formValues, calories: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-6 mb-3">
                                        <label htmlFor="protein" className="form-label" style={{ color: 'blue' }}>Protein (g)</label>
                                        <input
                                            type="number"
                                            className="form-control border-0 border-bottom"
                                            style={{ color: 'blue' }}
                                            id="protein"
                                            value={formValues.protein}
                                            onChange={(e) => setFormValues({ ...formValues, protein: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-6 mb-3">
                                        <label htmlFor="carbs" className="form-label" style={{ color: 'orange' }}>Carbohydrates (g)</label>
                                        <input
                                            type="number"
                                            className="form-control border-0 border-bottom"
                                            style={{ color: 'orange' }}
                                            id="carbs"
                                            value={formValues.carbs}
                                            onChange={(e) => setFormValues({ ...formValues, carbs: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-6 mb-3">
                                        <label htmlFor="fats" className="form-label" style={{ color: 'red' }}>Fats (g)</label>
                                        <input
                                            type="number"
                                            className="form-control border-0 border-bottom"
                                            style={{ color: 'red' }}
                                            id="fats"
                                            value={formValues.fats}
                                            onChange={(e) => setFormValues({ ...formValues, fats: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-6 mb-3">
                                        <label htmlFor="fiber" className="form-label" style={{ color: 'green' }}>Dietary Fiber (g)</label>
                                        <input
                                            type="number"
                                            className="form-control border-0 border-bottom"
                                            style={{ color: 'green' }}
                                            id="fiber"
                                            value={formValues.fiber}
                                            onChange={(e) => setFormValues({ ...formValues, fiber: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <button type="submit" className="btn btn-font btn-primary mb-2" style={{ padding: '10px 20px', fontSize: '16px'}}>Save Meal Log</button>
                        </div>

                    </form>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default MealsPage