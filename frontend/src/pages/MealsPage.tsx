import { useState, useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Modal, Alert, Tabs, Tab, Button, Accordion } from 'react-bootstrap'
import MealsChart from '../components/MealsChart'
import { mealService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
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
    const { user } = useAuth()
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
    const [activeTab, setActiveTab] = useState<'today' | 'history'>('today')
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingMeal, setEditingMeal] = useState<any>(null)
    const [editFormValues, setEditFormValues] = useState({
        mealName: '',
        mealType: 'lunch',
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
            console.log('Fetched meals:', meals)
            console.log('Today (toDateString):', new Date().toDateString())
            setLoggedMeals(meals)
            calculateDailyTotals(meals)
        } catch (error) {
            console.error('Error fetching meals:', error)
            // Keep empty for guests
            setLoggedMeals([])
            setDailyTotals({
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0,
                fiber: 0
            })
        }
    }

    const calculateDailyTotals = (meals: any[]) => {
        const today = new Date().toDateString()
        console.log('Filtering for today:', today)
        const todayMeals = meals.filter((meal: any) => {
            const mealDate = new Date(meal.created_at).toDateString()
            console.log(`Meal: ${meal.food_name}, Date: ${mealDate}, Match: ${mealDate === today}`)
            return mealDate === today
        })
        console.log('Today meals found:', todayMeals)

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

        if (!user) {
            alert('Please login to log meals')
            window.location.href = '/login'
            return
        }

        // Use search query as meal name if no food selected (custom food)
        const mealName = selectedFood?.name || searchQuery.trim() || 'Custom Meal'

        const mealData = {
            mealName: mealName,
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

    const handleCopyToToday = async (meal: any) => {
        if (!user) {
            alert('Please login to log meals')
            window.location.href = '/login'
            return
        }

        const mealData = {
            mealName: meal.food_name,
            mealType: meal.meal_type || 'lunch',
            calories: meal.calories,
            proteinGrams: meal.protein,
            fiberGrams: meal.fiber,
            carbsGrams: meal.carbs,
            fatsGrams: meal.fats
        }

        try {
            await mealService.createMeal(mealData)
            await fetchLoggedMeals()
            alert('Meal copied to today\'s diary!')
        } catch (error) {
            console.error('Error copying meal:', error)
            alert('Failed to copy meal')
        }
    }

    const handleEditMeal = (meal: any) => {
        setEditingMeal(meal)
        setEditFormValues({
            mealName: meal.food_name,
            mealType: meal.meal_type || 'lunch',
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            fiber: meal.fiber || 0
        })
        setShowEditModal(true)
    }

    const handleUpdateMeal = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user || !editingMeal) {
            alert('Please login to update meals')
            return
        }

        const mealData = {
            mealName: editFormValues.mealName,
            mealType: editFormValues.mealType,
            calories: editFormValues.calories,
            proteinGrams: editFormValues.protein,
            fiberGrams: editFormValues.fiber,
            carbsGrams: editFormValues.carbs,
            fatsGrams: editFormValues.fats
        }

        try {
            await mealService.updateMeal(editingMeal.id, mealData)
            setShowEditModal(false)
            setEditingMeal(null)
            await fetchLoggedMeals()
            alert('Meal updated successfully!')
        } catch (error) {
            console.error('Error updating meal:', error)
            alert('Failed to update meal')
        }
    }

    const handleDeleteMeal = async (id: number) => {
        if (!user) {
            alert('Please login to delete meals')
            window.location.href = '/login'
            return
        }

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
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mt-4">
                <div className="row">
                    <div className="col-12 ">
                        <h2 className="mb-4">Nutrition Overview</h2>
                        {user ? (
                            <MealsChart
                                calories={dailyTotals.calories}
                                protein={dailyTotals.protein}
                                carbs={dailyTotals.carbs}
                                fats={dailyTotals.fats}
                                fiber={dailyTotals.fiber}
                            />
                        ) : (
                            <div className="card border-0">
                                <div className="card-body text-center py-5">
                                    <h3 className="mb-3">{dailyTotals.calories} kcal</h3>
                                    <p className="text-muted">Total Calories Today</p>
                                    <Alert variant="info" className="mt-3">
                                        <small>Detailed macro breakdown (Protein, Carbs, Fats, Fiber) is available for registered users only.</small>
                                    </Alert>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>





            <div className="container mt-4">
                <div className="card">
                    <div className="card-body">
                        {!user && (
                            <Alert variant="info" className="mb-3">
                                <h6>Guest Mode</h6>
                                <p className="mb-0">You can search for food items and view calorie information. To log meals and track detailed macros, please login or sign up.</p>
                            </Alert>
                        )}
                        <div className="row mb-3">
                            <div className="col-6">
                                <h2>Meal Diary</h2>
                            </div>
                            <div className="col-6 text-end">
                                {user ? (
                                    <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
                                        <i className="bi bi-plus-lg"></i>
                                        <span>Log Meal</span>
                                    </button>
                                ) : (
                                    <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={() => window.location.href = '/login'}>
                                        <i className="bi bi-plus-lg"></i>
                                        <span>Log Meal</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k as 'today' | 'history')} className="mb-3">
                            <Tab eventKey="today" title="Today's Diary">
                                <div className="row">
                                    {(() => {
                                        const today = new Date().toDateString()
                                        console.log('Rendering Today tab, today:', today)
                                        const todayMeals = loggedMeals.filter((meal: any) => {
                                            const mealDate = new Date(meal.created_at).toDateString()
                                            console.log(`Render check - Meal: ${meal.food_name}, Date: ${mealDate}, Match: ${mealDate === today}`)
                                            return mealDate === today
                                        })
                                        console.log('Today meals to render:', todayMeals)

                                        // Group by category
                                        const categories = ['breakfast', 'lunch', 'dinner', 'snack']
                                        console.log('Categories to render:', categories)

                                        return categories.map((category) => {
                                            const categoryMeals = todayMeals.filter((meal: any) => {
                                                const match = meal.meal_type === category
                                                console.log(`Category check - Meal: ${meal.food_name}, Type: ${meal.meal_type}, Category: ${category}, Match: ${match}`)
                                                return match
                                            })
                                            console.log(`Category ${category} meals:`, categoryMeals)

                                            if (categoryMeals.length === 0) {
                                                console.log(`Skipping ${category} - no meals`)
                                                return null
                                            }

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
                                                                            {user ? (
                                                                                <>
                                                                                    {meal.calories} kcal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    {meal.calories} kcal
                                                                                </>
                                                                            )}
                                                                        </small>
                                                                    </div>
                                                                    {user && (
                                                                        <>
                                                                            <button
                                                                                className="btn btn-sm btn-outline-primary me-1"
                                                                                onClick={() => handleEditMeal(meal)}
                                                                            >
                                                                                <i className="bi bi-pencil"></i>
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-sm btn-outline-danger"
                                                                                onClick={() => handleDeleteMeal(meal.id)}
                                                                            >
                                                                                <i className="bi bi-trash"></i>
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        })
                                    })()}
                                    {loggedMeals.filter((meal: any) => new Date(meal.created_at).toDateString() === new Date().toDateString()).length === 0 && (
                                        <div className="col-12 text-center text-muted py-4">
                                            No meals logged today. Click "Log Meal" to add your first meal.
                                        </div>
                                    )}
                                </div>
                            </Tab>
                            <Tab eventKey="history" title="History">
                                <div className="row">
                                    {(() => {
                                        // Group meals by date (including today)
                                        const mealsByDate: Record<string, any[]> = {}
                                        loggedMeals.forEach((meal: any) => {
                                            const date = new Date(meal.created_at).toDateString()
                                            if (!mealsByDate[date]) {
                                                mealsByDate[date] = []
                                            }
                                            mealsByDate[date].push(meal)
                                        })
                                        console.log('Meals grouped by date:', mealsByDate)

                                        // Sort dates descending (newest first)
                                        const sortedDates = Object.keys(mealsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                                        console.log('Sorted dates:', sortedDates)

                                        if (sortedDates.length === 0) {
                                            return (
                                                <div className="col-12 text-center text-muted py-4">
                                                    No meal history available yet.
                                                </div>
                                            )
                                        }

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
                                                                        {mealsByDate[date].length} meal{mealsByDate[date].length !== 1 ? 's' : ''}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </Accordion.Header>
                                                        <Accordion.Body>
                                                            {mealsByDate[date].map((meal: any) => (
                                                                <div key={meal.id} className="card mb-2 border-0 bg-light">
                                                                    <div className="card-body py-2">
                                                                        <div className="d-flex text-fonts justify-content-between align-items-center">
                                                                            <div>
                                                                                <strong>{meal.food_name}</strong>
                                                                                <small className="text-fonts text-muted d-block">
                                                                                    {meal.meal_type} • {meal.calories} kcal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g
                                                                                </small>
                                                                            </div>
                                                                            {user && (
                                                                                <>
                                                                                    <Button
                                                                                        variant="outline-primary"
                                                                                        size="sm"
                                                                                        className="me-1"
                                                                                        onClick={() => handleEditMeal(meal)}
                                                                                    >
                                                                                        <i className="bi bi-pencil"></i>
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="outline-primary"
                                                                                        size="sm"
                                                                                        onClick={() => handleCopyToToday(meal)}
                                                                                    >
                                                                                        <i className="bi bi-plus-circle"></i> Copy
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </Accordion.Body>
                                                    </Accordion.Item>
                                                ))}
                                            </Accordion>
                                        )
                                    })()}
                                </div>
                            </Tab>
                        </Tabs>
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
                                placeholder="Search meals or type custom food name..."
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
                            {!selectedFood && searchQuery && searchResults.length === 0 && !isSearching && (
                                <div className="position-absolute w-100 bg-warning bg-opacity-10 border border-warning rounded shadow-lg mt-1 p-2 text-fonts text-muted" style={{ zIndex: 1000 }}>
                                    <small>No results found. You can add "{searchQuery}" as a custom food.</small>
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
                        {!selectedFood && searchQuery && (
                            <div className="mb-3 p-2 bg-info bg-opacity-10 border border-info rounded">
                                <small className="text-fonts text-muted">
                                    <strong>Custom Food:</strong> "{searchQuery}" - Enter nutritional values below
                                </small>
                            </div>
                        )}
                        {selectedFood && (
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
                        )}
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
                                            readOnly={!!selectedFood}
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
                                            readOnly={!!selectedFood}
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
                                            readOnly={!!selectedFood}
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
                                            readOnly={!!selectedFood}
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
                                            readOnly={!!selectedFood}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <button type="submit" className="btn btn-font btn-primary mb-2" style={{ padding: '10px 20px', fontSize: '16px'}}>
                                Log {selectedFood?.name || searchQuery.trim() || 'Custom Meal'}
                            </button>
                        </div>

                    </form>
                </Modal.Body>
            </Modal>

            {/* Edit Meal Modal */}
            <Modal show={showEditModal} size="lg" centered onHide={() => {
                setShowEditModal(false)
                setEditingMeal(null)
            }}>
                <Modal.Header className="border-0" closeButton>
                    <Modal.Title>Edit Meal</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleUpdateMeal}>
                        <div className="mb-3">
                            <label htmlFor="editMealName" className="form-label">Food Name</label>
                            <input
                                type="text"
                                className="form-control border-0 border-bottom"
                                id="editMealName"
                                value={editFormValues.mealName}
                                onChange={(e) => setEditFormValues({ ...editFormValues, mealName: e.target.value })}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="editMealCategory" className="form-label">Meal Category</label>
                            <select
                                className="form-select border-0 border-bottom"
                                id="editMealCategory"
                                value={editFormValues.mealType}
                                onChange={(e) => setEditFormValues({ ...editFormValues, mealType: e.target.value })}
                            >
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snack">Snack</option>
                            </select>
                        </div>
                        <div className="card border-0">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-6 mb-3">
                                        <label htmlFor="editCalories" className="form-label" style={{ color: 'purple' }}>Total Calories (kcal)</label>
                                        <input
                                            type="number"
                                            className="form-control border-0 border-bottom"
                                            style={{ color: 'purple' }}
                                            id="editCalories"
                                            value={editFormValues.calories}
                                            onChange={(e) => setEditFormValues({ ...editFormValues, calories: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-6 mb-3">
                                        <label htmlFor="editProtein" className="form-label" style={{ color: 'blue' }}>Protein (g)</label>
                                        <input
                                            type="number"
                                            className="form-control border-0 border-bottom"
                                            style={{ color: 'blue' }}
                                            id="editProtein"
                                            value={editFormValues.protein}
                                            onChange={(e) => setEditFormValues({ ...editFormValues, protein: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-6 mb-3">
                                        <label htmlFor="editCarbs" className="form-label" style={{ color: 'orange' }}>Carbohydrates (g)</label>
                                        <input
                                            type="number"
                                            className="form-control border-0 border-bottom"
                                            style={{ color: 'orange' }}
                                            id="editCarbs"
                                            value={editFormValues.carbs}
                                            onChange={(e) => setEditFormValues({ ...editFormValues, carbs: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-6 mb-3">
                                        <label htmlFor="editFats" className="form-label" style={{ color: 'red' }}>Fats (g)</label>
                                        <input
                                            type="number"
                                            className="form-control border-0 border-bottom"
                                            style={{ color: 'red' }}
                                            id="editFats"
                                            value={editFormValues.fats}
                                            onChange={(e) => setEditFormValues({ ...editFormValues, fats: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-6 mb-3">
                                        <label htmlFor="editFiber" className="form-label" style={{ color: 'green' }}>Dietary Fiber (g)</label>
                                        <input
                                            type="number"
                                            className="form-control border-0 border-bottom"
                                            style={{ color: 'green' }}
                                            id="editFiber"
                                            value={editFormValues.fiber}
                                            onChange={(e) => setEditFormValues({ ...editFormValues, fiber: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <button type="submit" className="btn btn-font btn-primary mb-2" style={{ padding: '10px 20px', fontSize: '16px'}}>
                                Update Meal
                            </button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default MealsPage