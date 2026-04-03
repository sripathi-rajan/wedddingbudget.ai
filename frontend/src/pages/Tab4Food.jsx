import { useState } from 'react'
import { useWedding, FOOD_CATEGORIES, FOOD_TIERS, BAR_TYPES, SPECIALTY_COUNTERS,
  FOOD_MENU, MEAL_TYPES, ALL_EVENTS, DISH_PRICES, formatRupees } from '../context/WeddingContext'
import { MultiImageSelector, SingleImageSelector } from '../components/ImageCard'

const C = { primary: '#023047', amber: '#ffb703', blue: '#219ebc', light: '#e8f4fa', sky: '#8ecae6', orange: '#fb8500' }

const MEAL_ICONS = { Breakfast: '🌅', Lunch: '🌞', Dinner: '🌙', Snacks: '🍿', Beverages: '🥤' }
const MEAL_LABELS = { Breakfast: 'Morning Buffet', Lunch: 'Lunch Buffet', Dinner: 'Gala Dinner', Snacks: 'Floating Snacks', Beverages: 'All-Day Beverages' }

// Catering staff calculation
function staffCount(guests) {
  if (guests <= 100) return 8
  if (guests <= 300) return 20
  if (guests <= 500) return 40
  return Math.ceil(guests / 12)
}
const STAFF_RATE = 1500 // per staff per day

function DishSelector({ eventId, mealType, categories, selectedDishMap, onToggle, customDishes, onAddCustom }) {
  const [inputs, setInputs] = useState({})

  return (
    <div style={{ marginTop: 10 }}>
      {categories.map(cat => {
        const stdMenu = FOOD_MENU[mealType]?.[cat] || []
        const custMenu = customDishes?.[cat] || []
        const allMenu = [...stdMenu, ...custMenu]
        const selected = selectedDishMap?.[cat] || []
        const catCost = selected.reduce((s, d) => s + (DISH_PRICES[d] || 0), 0)

        return (
          <div key={cat} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6,
              color: cat === 'Veg' ? '#047857' : cat === 'Non-Veg' ? '#dc2626' : '#7c5c00',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{cat === 'Veg' ? '🥦' : cat === 'Non-Veg' ? '🍗' : '🌿'} {cat}</span>
              {catCost > 0 && <span style={{ background: '#e8f4fa', padding: '2px 10px', borderRadius: 10, color: C.blue }}>
                ₹{catCost}/head selected
              </span>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {allMenu.map(dish => {
                const price = DISH_PRICES[dish]
                const isSel = selected.includes(dish)
                const isCust = custMenu.includes(dish)
                return (
                  <button key={dish} onClick={() => onToggle(eventId, mealType, cat, dish)}
                    style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      border: `1.5px solid ${isSel ? C.amber : C.sky}`,
                      background: isSel ? '#fffbea' : 'white',
                      color: isSel ? '#7a5900' : C.primary,
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isSel ? '✓ ' : ''}{dish}
                    {price > 0
                      ? <span style={{ fontSize: 10, color: isSel ? C.orange : C.blue, fontWeight: 700 }}>₹{price}/hd</span>
                      : null}
                    {isCust && <span style={{ fontSize: 9, color: '#888' }}> custom</span>}
                  </button>
                )
              })}
            </div>
            {/* Add custom dish */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                value={inputs[cat] || ''}
                onChange={e => setInputs(p => ({ ...p, [cat]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter' && inputs[cat]?.trim()) { onAddCustom(eventId, mealType, cat, inputs[cat].trim()); setInputs(p => ({...p,[cat]:''})) } }}
                placeholder={`Add custom ${cat} dish...`}
                style={{ flex: 1, minWidth: 140, padding: '5px 10px', border: `1px solid ${C.sky}`,
                  borderRadius: 8, fontSize: 12, fontFamily: 'Inter,sans-serif' }} />
              <button onClick={() => { if (inputs[cat]?.trim()) { onAddCustom(eventId, mealType, cat, inputs[cat].trim()); setInputs(p => ({...p,[cat]:''})) }}}
                style={{ padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${C.amber}`,
                  background: '#fffbea', color: C.primary, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                + Add
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EventFoodCard({ eventId, eventObj, wedding, onToggleMeal, onToggleDish, onCoversChange, onAddCustomDish }) {
  const [expanded, setExpanded] = useState(false)
  const selectedMeals = wedding.food_meals_per_event?.[eventId] || []
  const dishesMap = wedding.food_dishes?.[eventId] || {}   // { mealType: { cat: [dish,...] } }
  const covers = wedding.food_covers_per_meal?.[eventId] || {}
  const customDishesMap = wedding.food_custom_dishes?.[eventId] || {}  // { mealType: { cat: [dish] } }
  const categories = wedding.food_categories || []
  const defaultGuests = wedding.guest_counts_by_event?.[eventId] || wedding.total_guests || 0

  // Compute per-event cost from dish prices
  const eventCost = selectedMeals.reduce((sum, meal) => {
    const cnt = covers[meal] || defaultGuests
    const mealDishes = dishesMap[meal] || {}
    let dishCostPerHead = 0
    for (const cat of categories) {
      const catDishes = mealDishes[cat] || []
      dishCostPerHead += catDishes.reduce((s, d) => s + (DISH_PRICES[d] || 0), 0)
    }
    return sum + cnt * dishCostPerHead
  }, 0)

  return (
    <div style={{ border: `2px solid ${expanded ? C.amber : C.sky}`, borderRadius: 16,
      overflow: 'hidden', marginBottom: 14, background: 'white' }}>
      <div onClick={() => setExpanded(!expanded)}
        style={{ padding: '14px 18px', background: expanded ? '#fffbea' : C.light,
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <span style={{ fontSize: 24 }}>{eventObj?.emoji || '🎉'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.primary }}>{eventId}</div>
          <div style={{ fontSize: 12, color: C.blue }}>
            {selectedMeals.length > 0
              ? selectedMeals.map(m => MEAL_ICONS[m] + ' ' + m).join(' · ')
              : 'Click to plan meals'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {eventCost > 0 && (
            <div style={{ fontFamily: 'EB Garamond, serif', fontSize: 18, fontWeight: 700, color: '#7a5900' }}>
              {formatRupees(eventCost)}
            </div>
          )}
          <div style={{ fontSize: 18 }}>{expanded ? '▲' : '▼'}</div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '16px 18px' }}>
          {/* Meal toggles */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 8 }}>Select Meals:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MEAL_TYPES.map(meal => {
                const isSel = selectedMeals.includes(meal)
                return (
                  <button key={meal} onClick={() => onToggleMeal(eventId, meal)}
                    style={{ padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                      border: `2px solid ${isSel ? C.amber : C.sky}`,
                      background: isSel ? C.amber : 'white',
                      color: isSel ? C.primary : C.blue,
                      cursor: 'pointer', transition: 'all 0.2s' }}>
                    {MEAL_ICONS[meal]} {meal}
                    <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 4 }}>({MEAL_LABELS[meal]})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Per-meal dish config */}
          {selectedMeals.map(meal => {
            const cnt = covers[meal] || defaultGuests
            const mealDishes = dishesMap[meal] || {}
            const mealCustomDishes = customDishesMap[meal] || {}
            // total cost this meal
            let dishCostPerHead = 0
            for (const cat of categories) {
              const catDishes = mealDishes[cat] || []
              dishCostPerHead += catDishes.reduce((s, d) => s + (DISH_PRICES[d] || 0), 0)
            }
            const mealCost = cnt * dishCostPerHead
            return (
              <div key={meal} style={{ marginBottom: 18, padding: 14, background: C.light, borderRadius: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.primary, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{MEAL_ICONS[meal]} {meal} — {MEAL_LABELS[meal]}</span>
                  {mealCost > 0 && (
                    <span style={{ fontFamily: 'EB Garamond, serif', color: '#7a5900' }}>
                      {formatRupees(mealCost)} <span style={{ fontSize: 12, fontWeight: 400 }}>({formatRupees(dishCostPerHead)}/head)</span>
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.primary, minWidth: 90 }}>Covers:</label>
                  <input type="number" min={0}
                    value={covers[meal] || ''}
                    placeholder={`${defaultGuests} (default)`}
                    onChange={e => onCoversChange(eventId, meal, parseInt(e.target.value) || 0)}
                    style={{ width: 90, padding: '5px 9px', border: `1.5px solid ${C.sky}`,
                      borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
                </div>
                {categories.length > 0 ? (
                  <DishSelector
                    eventId={eventId} mealType={meal} categories={categories}
                    selectedDishMap={mealDishes}
                    customDishes={mealCustomDishes}
                    onToggle={onToggleDish}
                    onAddCustom={onAddCustomDish}
                  />
                ) : (
                  <div style={{ fontSize: 12, color: '#4a7a94', fontStyle: 'italic' }}>
                    Select food category (Veg/Non-Veg/Jain) above to see dish menu.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Tab4Food() {
  const { wedding, update } = useWedding()

  const toggleMeal = (eventId, meal) => {
    const cur = { ...(wedding.food_meals_per_event || {}) }
    const meals = cur[eventId] || []
    cur[eventId] = meals.includes(meal) ? meals.filter(m => m !== meal) : [...meals, meal]
    update('food_meals_per_event', cur)
  }

  const toggleDish = (eventId, mealType, cat, dish) => {
    const dishes = { ...(wedding.food_dishes || {}) }
    const evDishes = { ...(dishes[eventId] || {}) }
    const mealDishes = { ...(evDishes[mealType] || {}) }
    const catList = mealDishes[cat] || []
    mealDishes[cat] = catList.includes(dish) ? catList.filter(d => d !== dish) : [...catList, dish]
    evDishes[mealType] = mealDishes
    dishes[eventId] = evDishes
    update('food_dishes', dishes)
  }

  const addCustomDish = (eventId, mealType, cat, dish) => {
    if (!dish) return
    const root = { ...(wedding.food_custom_dishes || {}) }
    const evRoot = { ...(root[eventId] || {}) }
    const mealRoot = { ...(evRoot[mealType] || {}) }
    const catList = mealRoot[cat] || []
    if (catList.includes(dish)) return
    mealRoot[cat] = [...catList, dish]
    evRoot[mealType] = mealRoot
    root[eventId] = evRoot
    update('food_custom_dishes', root)
  }

  const onCoversChange = (eventId, meal, count) => {
    const covers = { ...(wedding.food_covers_per_meal || {}) }
    covers[eventId] = { ...(covers[eventId] || {}), [meal]: count }
    update('food_covers_per_meal', covers)
  }

  // Build all event list (standard + custom)
  const allEvents = [
    ...(wedding.events || []).map(id => {
      const obj = ALL_EVENTS.find(e => e.id === id)
      const cust = (wedding.custom_events || []).find(e => e.id === id)
      return { id, obj: obj || cust }
    })
  ]

  const totalGuests = wedding.total_guests || 0
  const staff = staffCount(totalGuests)
  const staffCost = staff * STAFF_RATE * Math.max(1, (wedding.events || []).length)
  const crockeryCost = totalGuests * 150
  const linenCost = totalGuests * 100

  const totalFoodCost = () => {
    const categories = wedding.food_categories || []
    let mealTotal = 0
    for (const ev of (wedding.events || [])) {
      const meals = wedding.food_meals_per_event?.[ev] || []
      for (const meal of meals) {
        const cnt = wedding.food_covers_per_meal?.[ev]?.[meal] || totalGuests
        const mealDishes = wedding.food_dishes?.[ev]?.[meal] || {}
        let perHead = 0
        for (const cat of categories) {
          const catDishes = mealDishes[cat] || []
          perHead += catDishes.reduce((s, d) => s + (DISH_PRICES[d] || 0), 0)
        }
        mealTotal += cnt * perHead
      }
    }
    const barTotal = ({ 'Dry Event': 0, 'Beer-Wine': 500, 'Full Bar': 1200 }[wedding.bar_type] || 0) * totalGuests * Math.max(1, (wedding.events || []).length)
    const specialtyTotal = (wedding.specialty_counters || []).reduce((s, id) => {
      const item = SPECIALTY_COUNTERS.find(x => x.id === id)
      return s + (item?.rate_per_head || 0) * totalGuests
    }, 0)
    return mealTotal + barTotal + specialtyTotal + staffCost + crockeryCost + linenCost
  }

  return (
    <div>
      {/* Food Category */}
      <div className="section-card">
        <div className="section-title">🥗 Food Category</div>
        <MultiImageSelector items={FOOD_CATEGORIES} selected={wedding.food_categories || []}
          onChange={v => update('food_categories', v)} />
      </div>

      {/* Food Budget Tier */}
      <div className="section-card">
        <div className="section-title">🍽️ Food Budget Tier</div>
        <SingleImageSelector items={FOOD_TIERS} selected={wedding.food_budget_tier}
          onChange={v => update('food_budget_tier', v)} showCost />
        {wedding.food_budget_tier && (
          <div style={{ marginTop: 12, padding: 12, background: C.light, borderRadius: 10, fontSize: 12, color: C.blue }}>
            Cost is now calculated per dish × covers. Select dishes per event below.
          </div>
        )}
      </div>

      {/* Bar Type */}
      <div className="section-card">
        <div className="section-title">🍸 Bar Type</div>
        <SingleImageSelector items={BAR_TYPES} selected={wedding.bar_type}
          onChange={v => update('bar_type', v)} showCost />
      </div>

      {/* Specialty Counters */}
      <div className="section-card">
        <div className="section-title">🎪 Specialty Counters</div>
        <div style={{ fontSize: 12, color: '#4a7a94', marginBottom: 12 }}>
          All counters priced per head × total guests ({totalGuests} guests)
        </div>
        <MultiImageSelector items={SPECIALTY_COUNTERS} selected={wedding.specialty_counters || []}
          onChange={v => update('specialty_counters', v)} showCost />
        {(wedding.specialty_counters || []).length > 0 && (
          <div style={{ marginTop: 12, padding: 12, background: '#e8faf0', borderRadius: 10, fontSize: 12, color: '#047857', fontWeight: 600 }}>
            {(wedding.specialty_counters || []).map(id => {
              const item = SPECIALTY_COUNTERS.find(x => x.id === id)
              if (!item) return null
              return (
                <span key={id} style={{ display: 'inline-flex', gap: 4, marginRight: 14 }}>
                  {item.emoji} {item.label}: {formatRupees((item.rate_per_head || 0) * totalGuests)}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Per-Event Meal Planning */}
      {allEvents.length > 0 && wedding.food_budget_tier && (
        <div className="section-card">
          <div className="section-title">📅 Meals Per Event — Dish-by-Dish Planning</div>
          <div style={{ fontSize: 13, color: '#4a7a94', marginBottom: 16 }}>
            Each dish has its own per-head price. Select dishes and set guest covers per meal.
          </div>
          {(wedding.food_categories || []).length === 0 && (
            <div style={{ padding: '10px 14px', background: '#fff8e1', borderRadius: 10, fontSize: 13, color: '#7a5900', marginBottom: 12 }}>
              ⚠️ Select food category (Veg/Non-Veg/Jain) above to unlock dish selection.
            </div>
          )}
          {allEvents.map(({ id, obj }) => (
            <EventFoodCard key={id} eventId={id} eventObj={obj} wedding={wedding}
              onToggleMeal={toggleMeal} onToggleDish={toggleDish}
              onCoversChange={onCoversChange} onAddCustomDish={addCustomDish} />
          ))}
        </div>
      )}

      {/* Catering Staff */}
      {totalGuests > 0 && (
        <div className="section-card">
          <div className="section-title">👨‍🍳 Catering Staff</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { label: 'Staff Required', value: `${staff} staff` },
              { label: 'Rate / Staff / Day', value: `₹${STAFF_RATE.toLocaleString()}` },
              { label: 'Days / Events', value: `${Math.max(1, (wedding.events||[]).length)} days` },
            ].map(s => (
              <div key={s.label} style={{ background: C.light, borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#4a7a94', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: 'EB Garamond,serif', fontSize: 20, fontWeight: 700, color: C.primary }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, textAlign: 'right', fontFamily: 'EB Garamond,serif', fontSize: 18, color: '#047857', fontWeight: 700 }}>
            Staff Cost: {formatRupees(staffCost)}
          </div>
        </div>
      )}

      {/* Crockery & Linen */}
      {totalGuests > 0 && (
        <div className="section-card">
          <div className="section-title">🍴 Crockery & Linen Rental</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            {[
              { label: 'Crockery Rental', detail: `₹150/head × ${totalGuests} guests`, value: crockeryCost },
              { label: 'Linen & Chair Covers', detail: `₹100/head × ${totalGuests} guests`, value: linenCost },
            ].map(r => (
              <div key={r.label} style={{ background: C.light, borderRadius: 12, padding: 16,
                border: `1px solid ${C.sky}`, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.primary, marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 11, color: '#4a7a94', marginBottom: 8 }}>{r.detail}</div>
                <div style={{ fontFamily: 'EB Garamond,serif', fontSize: 22, fontWeight: 700, color: C.blue }}>
                  {formatRupees(r.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Estimate */}
      {wedding.food_budget_tier && (
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #fffbea, #e8f4fa)',
          border: `2px solid ${C.amber}` }}>
          <div className="section-title" style={{ color: C.primary }}>💰 Food & Beverage Estimate</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 4 }}>
            {[
              { label: 'Food (all meals/events)', value: (() => {
                  const categories = wedding.food_categories || []
                  let t = 0
                  for (const ev of (wedding.events || [])) {
                    const meals = wedding.food_meals_per_event?.[ev] || []
                    for (const meal of meals) {
                      const cnt = wedding.food_covers_per_meal?.[ev]?.[meal] || totalGuests
                      const mealDishes = wedding.food_dishes?.[ev]?.[meal] || {}
                      let perHead = 0
                      for (const cat of categories) {
                        const catDishes = mealDishes[cat] || []
                        perHead += catDishes.reduce((s, d) => s + (DISH_PRICES[d] || 0), 0)
                      }
                      t += cnt * perHead
                    }
                  }
                  return t
                })()
              },
              { label: 'Bar / Beverages', value: ({ 'Dry Event': 0, 'Beer-Wine': 500, 'Full Bar': 1200 }[wedding.bar_type] || 0) * totalGuests * Math.max(1, (wedding.events||[]).length) },
              { label: 'Specialty Counters', value: (wedding.specialty_counters || []).reduce((s, id) => {
                const item = SPECIALTY_COUNTERS.find(x => x.id === id)
                return s + (item?.rate_per_head || 0) * totalGuests
              }, 0) },
              { label: 'Staff + Crockery + Linen', value: staffCost + crockeryCost + linenCost },
            ].map(item => (
              <div key={item.label} style={{ background: 'white', borderRadius: 12, padding: 16, textAlign: 'center',
                border: `1px solid ${C.sky}` }}>
                <div style={{ fontSize: 12, color: '#4a7a94', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontFamily: 'EB Garamond, serif', fontSize: 22, fontWeight: 700, color: C.primary }}>
                  {formatRupees(item.value)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#4a7a94', marginBottom: 4 }}>Total Food & Beverage</div>
            <div style={{ fontFamily: 'EB Garamond, serif', fontSize: 38, fontWeight: 800, color: C.primary }}>
              {formatRupees(totalFoodCost())}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
