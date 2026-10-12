function calculateRemaining(consumed, goals) {
  return {
    calories: Math.max(0, goals.calories - consumed.calories),
    proteins: Math.max(0, goals.proteins - consumed.proteins),
    carbs: Math.max(0, goals.carbs - consumed.carbs),
    fats: Math.max(0, goals.fats - consumed.fats)
  };
}

function getMealType() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 22) return 'dinner';
  return 'snack';
}

function analyzeDietHistory(mealHistory) {
  if (!mealHistory || mealHistory.length === 0) {
    return {
      topFoods: [],
      mealCount: 0,
      avgCaloriesPerMeal: 0,
      summary: ''
    };
  }

  const foodFrequency = {};
  let totalCalories = 0;
  let totalProteins = 0;

  mealHistory.forEach(meal => {
    if (meal.foodItem) {
      const foods = meal.foodItem.split(',').map(f => f.trim().toLowerCase());
      foods.forEach(food => {
        if (food.length > 2) {
          foodFrequency[food] = (foodFrequency[food] || 0) + 1;
        }
      });
    }
    totalCalories += parseFloat(meal.calories) || 0;
    totalProteins += parseFloat(meal.proteins) || 0;
  });

  const topFoods = Object.entries(foodFrequency)
    .filter(([food, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([food]) => food);

  const summary = topFoods.length > 0
    ? `Frequently eaten: ${topFoods.join(', ')}`
    : 'No significant meal history yet';

  return {
    topFoods,
    mealCount: mealHistory.length,
    avgCaloriesPerMeal: mealHistory.length > 0 ? Math.round(totalCalories / mealHistory.length) : 0,
    avgProteinPerMeal: mealHistory.length > 0 ? Math.round(totalProteins / mealHistory.length) : 0,
    summary
  };
}

function analyzePreferences(mealHistory) {
  const foodFrequency = {};
  mealHistory.forEach(meal => {
    if (meal.foodItem) {
      const foods = meal.foodItem.split(',').map(f => f.trim().toLowerCase());
      foods.forEach(food => {
        foodFrequency[food] = (foodFrequency[food] || 0) + 1;
      });
    }
  });
  return Object.entries(foodFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([food]) => food);
}

function formatDietaryRestrictions(restrictions) {
  if (!restrictions) return '';

  const active = [];
  if (restrictions.vegetarian) active.push('vegetarian (no meat/fish)');
  if (restrictions.vegan) active.push('vegan (no animal products)');
  if (restrictions.halal) active.push('halal');
  if (restrictions.kosher) active.push('kosher');
  if (restrictions.noBeef) active.push('no beef');
  if (restrictions.noPork) active.push('no pork');
  if (restrictions.glutenFree) active.push('gluten-free');
  if (restrictions.dairyFree) active.push('dairy-free');

  return active.length > 0 ? active.join(', ') : 'none';
}

function buildMealPrompt(remaining, mealType, preferences, location, dietaryRestrictions, mealHistory) {
  const historyAnalysis = analyzeDietHistory(mealHistory);
  const restrictions = formatDietaryRestrictions(dietaryRestrictions);

  let locationStr = 'Not specified';
  if (location && location.country) {
    locationStr = location.city
      ? `${location.city}, ${location.country}`
      : location.country;
    if (location.region) {
      locationStr += ` (${location.region} region)`;
    }
  }

  return `You are a nutritionist. Generate personalized meal recommendations.

USER INFO:
- Location: ${locationStr}
- Dietary restrictions: ${restrictions}
- Remaining macros today: ${remaining.calories} cal, ${remaining.proteins}g protein, ${remaining.carbs}g carbs, ${remaining.fats}g fat
- Meal type: ${mealType}
- Meals logged (30 days): ${historyAnalysis.mealCount}
- ${historyAnalysis.summary}

INSTRUCTIONS:
1. Suggest exactly 3 ${mealType} meals
2. Use foods that are locally available and culturally appropriate for the user's location
3. STRICTLY follow dietary restrictions
4. Consider the user's eating history when making suggestions
5. Each meal should fit within remaining macros
6. IMPORTANT: Provide approximate total weight in grams (e.g. "350g") and specify ingredient quantities in grams where possible (e.g. "100g Rice")

Respond with ONLY valid JSON (no markdown):
{
    "recommendations": [
    {
      "name": "Meal Name",
      "description": "Brief description",
      "totalWeight": "350g",
      "calories": 400,
      "proteins": 30,
      "carbs": 40,
      "fats": 12,
      "servingSize": "1 bowl (350g)",
      "ingredients": ["100g Chicken Breast", "150g Rice", "Vegetables"],
      "prepTime": "15 minutes",
      "tags": ["tag1", "tag2"]
    }
  ]
}`;
}

module.exports = {
  calculateRemaining,
  getMealType,
  analyzePreferences,
  analyzeDietHistory,
  buildMealPrompt
};
