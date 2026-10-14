const express = require('express');
require('dotenv').config();
const userRouter = express.Router();
const bcrypt = require('bcryptjs');
const { UserModel } = require('../Model/users.model');
const jwt = require('jsonwebtoken');
const { auth } = require('../Middleware/auth.middleware');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  calculateRemaining,
  getMealType,
  analyzePreferences,
  analyzeDietHistory,
  buildMealPrompt
} = require('../utils/nutritionHelpers');

/**
 * Resilient Groq chat completions caller with automatic model fallback.
 * Prevents 500 crashes when Groq decommissions, updates, or rate-limits specific models.
 */
async function callGroqChat(messages, options = {}) {
  const modelsToTry = [
    process.env.GROQ_MODEL,
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b'
  ].filter(Boolean);

  let lastError = null;
  for (const model of modelsToTry) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.Groq}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          ...options
        }),
      });
      const data = await response.json();
      if (response.ok && data.choices && data.choices[0] && data.choices[0].message) {
        return data;
      }
      console.warn(`[Groq Warning] Model "${model}" failed:`, data.error ? data.error.message : data);
      lastError = data.error || data;
    } catch (err) {
      console.warn(`[Groq Error] Network/fetch failed for "${model}":`, err.message);
      lastError = err;
    }
  }
  throw new Error(lastError ? (lastError.message || JSON.stringify(lastError)) : 'All Groq models failed');
}

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed!'), false);
    }
  }
});

userRouter.get('/health', (req, res) => {
  res.json({ status: "healthy", message: "API connected successfully" });
});

userRouter.post('/signup', async (req, res) => {
  const { name, email, password, height, age, weight, activitylevel, gender } = req.body
  try {
    if (!email || !password) {
      return res.status(400).send({ msg: "Email and password are required" });
    }
    const hash = await bcrypt.hash(password, 5);
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(200).send({ msg: "User already registered" });
    }
    const user = new UserModel({
      name, email, height, age, weight, gender, activitylevel, password: hash,
    })
    await user.save();
    res.status(200).send({ msg: "The new use is registered scuccessfully", new_user: req.body })
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).send({ err: err.message || "Internal Server Error" })
  }
})

userRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`\n========================================`);
  console.log(`[AUTH DEBUG] Incoming login request`);
  console.log(`[AUTH DEBUG] Email provided: "${email}"`);
  console.log(`[AUTH DEBUG] Password provided: ${password ? '(received, length: ' + password.length + ')' : '(missing)'}`);
  try {
    if (!email || !password) {
      console.log(`[AUTH DEBUG] Missing email or password`);
      return res.status(200).send({ msg: "Email and password are required" });
    }

    const cleanEmail = email.trim();
    const user = await UserModel.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });

    if (!user) {
      console.log(`[AUTH DEBUG] ❌ No user found with email "${cleanEmail}" in database!`);
      const allUsers = await UserModel.find({}, 'email name');
      console.log(`[AUTH DEBUG] Existing users in DB count: ${allUsers.length}. Emails:`, allUsers.map(u => u.email));
      return res.status(200).send({ msg: "User Does not exist. Please sign up first." });
    }

    console.log(`[AUTH DEBUG] ✔ User found in DB: ${user.name} (${user.email})`);
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    console.log(`[AUTH DEBUG] Password check result: ${isPasswordMatch ? 'MATCH (Correct)' : 'MISMATCH (Wrong password)'}`);

    if (isPasswordMatch) {
      const token = jwt.sign({ email: user.email }, "masai", { expiresIn: '1h' });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 60 * 60 * 1000,
      });
      console.log(`[AUTH DEBUG] ✔ Login successful! Token generated.`);
      console.log(`========================================\n`);
      res.status(200).send({ msg: "Login Successfull", token: token });
    } else {
      console.log(`[AUTH DEBUG] ❌ Login failed: Wrong password.`);
      console.log(`========================================\n`);
      res.status(200).send({ msg: "Wrong credentials. Incorrect password." });
    }
  } catch (err) {
    console.error("[AUTH DEBUG ERROR]:", err);
    console.log(`========================================\n`);
    res.status(500).send({ err: err.message || "Internal Server Error" });
  }
});


userRouter.post('/query', async (req, res) => {
  try {
    const { query } = req.body;

    const data = await callGroqChat([
      {
        role: 'system',
        content:
          "You are a helpful nutrition assistant. Only answer questions related to food nutrition and your response will have calories, proteins, carbohydrates, fats, fiber, and sugar. The response should not be in range it should always be a number. If user specifies specific amount then make your response according to it. Here is some example: 'How many calories are in 200g of chicken breast?' and the answer should be '300 40 5 0 0 0 200 Chicken Breast' (In this response first number is calories, second number is proteins, third number is carbohydrates, fourth number is fats, fifth number is fiber, sixth number is sugar, seventh number is amount and finally the food item name). 'How many calories are in chicken breast?' OR 'Ice cream' OR 'Ice cream nutrition' OR 'Ice cream calories' OR 'Ice cream fats' OR 'Ice cream proteins' and your response to all such questions should have following format '160 20 0 100 0 20 100 Chicken Breast', Notice the second question is not specific about the amount but you are still giving the answer in 100g. If user asks about the calories in a specific amount then give the answer according to that amount. If user is asking about nutrition of an item that is not eaten by humans or any random question then just respond with 'NO! dont me that, i can only help if you ask for nutrition of a food item, (witty reply)' notice after 'NO! dont ask me that, i can only help if you ask for nutrition of a food item' i have written 'witty reply' which means your response to such questions should always have 'NO! dont ask me that, i can only help if you ask for nutrition of a food item' in start then you can add a witty line troll the user for asking that question. For example: 'How many calories in sun rays?' 'NO! dont ask me such questions, i can only help if you ask for nutrition of a food item. Btw, maybe you should ask jadoo about that'. In this example to give a witty reply i used a reference of an alien called jadoo from a movie called koi mil gaya who users sun rays as source of energy. If User aks nutition by using quantity in numbers like one egg then also reponse by assuming quantity in 100 grams",
      },
      { role: 'user', content: query },
    ]);

    const answer = data.choices[0].message.content;
    res.status(200).json({ reply: answer });

  } catch (error) {
    console.error('Groq API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

userRouter.post('/addcalories', auth, async (req, res) => {
  const email = req.body.email;
  console.log(email)
  if (!email) {
    return res.status(400).json({ msg: "Email is required" });
  }

  try {
    const { calories, foodItem, foodAmount, proteins, fats, carbs } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.calories.push({ calories, foodItem, foodAmount, proteins, fats, carbs });
    await user.save();

    res.status(200).json({ msg: "Calories added to user profile", user });
  } catch (err) {
    res.status(500).json({ msg: "Error saving calorie info", error: err.message });
  }
});

userRouter.get('/getProfile', auth, async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ msg: "Email is required" });
  }

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({ user: user });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching calorie info", error: err.message });
  }
});

userRouter.patch('/updateProfile/:userid', async (req, res) => {
  const id = req.params.userid
  try {
    await UserModel.findByIdAndUpdate({ _id: id }, req.body)
    res.status(200).send({ "msg": `The profile of user with id- ${id} has been updated successfully`, "update": req.body })
  }
  catch (err) {
    res.status(400).send({ "err": err })
  }
})

userRouter.post('/logout', (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
  });

  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    expires: new Date(0),
    path: "/",
  });

  res.status(200).send({ msg: "Logged out successfully" });
});

userRouter.get('/verify', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(200).json({ loggedIn: false });

  try {
    const decoded = jwt.verify(token, "masai");
    res.status(200).json({ loggedIn: true, user: decoded });
  } catch (err) {
    res.status(200).json({ loggedIn: false });
  }
});

userRouter.post('/saveVoiceSession', auth, async (req, res) => {
  const { email, transcript, duration } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.voiceSessions.push({
      transcript,
      duration_seconds: duration,
      session_date: new Date()
    });

    await user.save();
    res.status(200).json({
      msg: "Voice session saved successfully",
      sessionCount: user.voiceSessions.length
    });
  } catch (err) {
    console.error('Error saving voice session:', err);
    res.status(500).json({ error: err.message });
  }
});
userRouter.get('/getVoiceContext', auth, async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ msg: "Email is required" });
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const pastSessions = user.voiceSessions
      ? user.voiceSessions.slice(-3).reverse()
      : [];

    const recentMeals = user.calories
      ? user.calories.slice(-5).reverse()
      : [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysMeals = user.calories.filter(m =>
      new Date(m.timestamp) >= today
    );
    const todaysCalories = todaysMeals.reduce((sum, m) =>
      sum + parseInt(m.calories || 0), 0
    );

    let context = `User Profile:
- Name: ${user.name || 'Unknown'}
- Age: ${user.age || 'Not specified'}, Gender: ${user.gender || 'Not specified'}
- Weight: ${user.weight || 'Not specified'}kg, Height: ${user.height || 'Not specified'}cm
- Activity Level: ${user.activitylevel || 'Not specified'}
- Today's Calories: ${todaysCalories} cal
`;
    if (recentMeals.length > 0) {
      context += `\nRecent Meals (last 5):\n`;
      recentMeals.forEach(m => {
        context += `- ${m.foodItem} (${m.foodAmount}g): ${m.calories} cal, ${m.proteins}g protein, ${m.carbs}g carbs, ${m.fats}g fat\n`;
      });
    }
    if (pastSessions.length > 0) {
      context += `\nPrevious Conversations:\n`;
      pastSessions.forEach(s => {
        const date = new Date(s.session_date).toLocaleDateString();
        context += `\nSession ${date}:\n`;
        s.transcript.forEach(t => {
          context += `${t.role}: ${t.content}\n`;
        });
      });
    }

    res.status(200).json({
      context: context.trim(),
      recentMeals,
      pastSessions,
      todaysCalories
    });
  } catch (err) {
    console.error('Error getting voice context:', err);
    res.status(500).json({ error: err.message });
  }
});

userRouter.post('/analyze-image', upload.single('image'), async (req, res) => {
  console.log("hiii")
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }
    console.log('Analyzing food image:', req.file.originalname);
    console.log("Key Check:", process.env.GEMINI_API_KEY ? "Key Found" : "Key UNDEFINED");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `Analyze this food image and provide nutritional information.
        Output ONLY a JSON object (no markdown, no code blocks):
        {
          "foodItems": [
            {
              "name": "Food name",
              "amount": "estimated grams",
              "confidence": 0.95
            }
          ],
          "nutrition": {
            "calories": number,
            "proteins": number,
            "carbs": number,
            "fats": number
          }
        }
        If multiple items, list all and sum nutrition. Be precise with estimates.`;
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype,
      },
    };
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in AI response');
    }
    const data = JSON.parse(jsonMatch[0]);
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze image'
    });
  }
});

userRouter.post('/daily-goals', auth, async (req, res) => {
  try {
    const { calories, proteins, carbs, fats, email } = req.body;

    if (!calories || !proteins || !carbs || !fats) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (calories < 0 || proteins < 0 || carbs < 0 || fats < 0) {
      return res.status(400).json({
        success: false,
        message: 'Values must be positive numbers'
      });
    }

    const user = await UserModel.findOneAndUpdate(
      { email },
      {
        dailyGoals: { calories, proteins, carbs, fats }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Daily goals updated successfully',
      goals: user.dailyGoals
    });
  } catch (error) {
    console.error('Error setting daily goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update daily goals'
    });
  }
});

userRouter.get('/daily-goals', auth, async (req, res) => {
  try {
    const { email } = req.query;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      goals: user.dailyGoals || {
        calories: 2000,
        proteins: 150,
        carbs: 250,
        fats: 65
      }
    });
  } catch (error) {
    console.error('Error fetching daily goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily goals'
    });
  }
});

userRouter.get('/today-nutrition', auth, async (req, res) => {
  try {
    const { email } = req.query;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMeals = user.calories.filter(meal => {
      const mealDate = new Date(meal.timestamp);
      return mealDate >= today && mealDate < tomorrow;
    });

    const consumed = todayMeals.reduce((total, meal) => ({
      calories: total.calories + (parseFloat(meal.calories) || 0),
      proteins: total.proteins + (parseFloat(meal.proteins) || 0),
      carbs: total.carbs + (parseFloat(meal.carbs) || 0),
      fats: total.fats + (parseFloat(meal.fats) || 0)
    }), { calories: 0, proteins: 0, carbs: 0, fats: 0 });

    const goals = user.dailyGoals || {
      calories: 2000,
      proteins: 150,
      carbs: 250,
      fats: 65
    };

    const remaining = calculateRemaining(consumed, goals);

    res.status(200).json({
      success: true,
      consumed,
      goals,
      remaining
    });
  } catch (error) {
    console.error('Error fetching today nutrition:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nutrition data'
    });
  }
});

let mealRecommendationCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000;

async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

userRouter.post('/meal-recommendations', auth, async (req, res) => {
  try {
    const { email, count = 3, mealType } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }


    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMeals = user.calories.filter(meal => {
      const mealDate = new Date(meal.timestamp);
      return mealDate >= today && mealDate < tomorrow;
    });

    const consumed = todayMeals.reduce((total, meal) => ({
      calories: total.calories + (parseFloat(meal.calories) || 0),
      proteins: total.proteins + (parseFloat(meal.proteins) || 0),
      carbs: total.carbs + (parseFloat(meal.carbs) || 0),
      fats: total.fats + (parseFloat(meal.fats) || 0)
    }), { calories: 0, proteins: 0, carbs: 0, fats: 0 });

    const goals = user.dailyGoals || {
      calories: 2000,
      proteins: 150,
      carbs: 250,
      fats: 65
    };

    const remaining = calculateRemaining(consumed, goals);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mealHistory = user.calories.filter(meal => {
      const mealDate = new Date(meal.timestamp);
      return mealDate >= thirtyDaysAgo;
    });

    const preferences = analyzePreferences(mealHistory);
    const determinedMealType = mealType || getMealType();

    const userLocation = user.location || { country: '', city: '', region: '' };
    const dietaryRestrictions = user.dietaryRestrictions || {};
    const prompt = buildMealPrompt(
      remaining,
      determinedMealType,
      preferences,
      userLocation,
      dietaryRestrictions,
      mealHistory
    );

    try {
      const data = await retryWithBackoff(async () => {
        return await callGroqChat([
          {
            role: 'system',
            content: 'You are a professional nutritionist specializing in regional cuisines and personalized meal planning. Generate culturally appropriate meal recommendations based on the user\'s location, dietary restrictions, and eating history. Always respond with valid JSON only. No markdown, no code blocks.'
          },
          { role: 'user', content: prompt }
        ]);
      });

      let textResponse = data.choices[0].message.content;

      textResponse = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let aiData;
      try {
        aiData = JSON.parse(textResponse);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError.message);
        console.error('Failed to parse text:', textResponse);
        throw new Error('Failed to parse AI response as JSON');
      }

      if (!aiData.recommendations || !Array.isArray(aiData.recommendations)) {
        console.error('Invalid response structure. Received:', JSON.stringify(aiData, null, 2));
        throw new Error('Invalid AI response format - missing recommendations array');
      }

      mealRecommendationCache = aiData.recommendations;
      cacheTimestamp = Date.now();

      res.status(200).json({
        success: true,
        remaining,
        mealType: determinedMealType,
        recommendations: aiData.recommendations.slice(0, count)
      });

    } catch (apiError) {
      console.error('AI API Error:', apiError.message);

      if (apiError.status === 429) {
        if (mealRecommendationCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
          return res.status(200).json({
            success: true,
            remaining,
            mealType: determinedMealType,
            recommendations: mealRecommendationCache.slice(0, count),
            cached: true,
            note: 'Using cached recommendations due to API quota limit'
          });
        }
      }

      throw apiError;
    }

  } catch (error) {
    console.error('Error generating meal recommendations:', error);

    const fallbackRecommendations = [
      {
        name: 'Grilled Chicken Salad',
        description: 'Classic healthy option with lean protein',
        calories: 350,
        proteins: 40,
        carbs: 20,
        fats: 12,
        servingSize: '1 large bowl',
        ingredients: ['200g grilled chicken', 'mixed greens', 'olive oil dressing'],
        prepTime: '15 minutes',
        tags: ['high-protein', 'low-carb', 'quick']
      },
      {
        name: 'Salmon with Quinoa',
        description: 'Omega-3 rich meal with complete protein',
        calories: 520,
        proteins: 45,
        carbs: 50,
        fats: 18,
        servingSize: '1 plate',
        ingredients: ['150g salmon', '200g quinoa', 'steamed vegetables'],
        prepTime: '25 minutes',
        tags: ['omega-3', 'balanced', 'nutritious']
      },
      {
        name: 'Turkey Wrap',
        description: 'Light and satisfying with whole grains',
        calories: 400,
        proteins: 35,
        carbs: 45,
        fats: 10,
        servingSize: '1 wrap',
        ingredients: ['150g turkey breast', 'whole wheat tortilla', 'vegetables'],
        prepTime: '10 minutes',
        tags: ['quick', 'portable', 'balanced']
      }
    ];

    res.status(200).json({
      success: true,
      remaining: { calories: 800, proteins: 60, carbs: 80, fats: 25 },
      mealType: 'lunch',
      recommendations: fallbackRecommendations,
      note: 'Using fallback recommendations due to AI error'
    });
  }
});

userRouter.post('/meal-detail', auth, async (req, res) => {
  try {
    const { email, meal } = req.body;

    if (!meal || !meal.name) {
      return res.status(400).json({
        success: false,
        message: 'Meal data is required'
      });
    }

    const prompt = `Generate detailed cooking instructions for this meal.

MEAL: ${meal.name}
DESCRIPTION: ${meal.description || 'A delicious meal'}
INGREDIENTS: ${meal.ingredients?.join(', ') || 'Not specified'}
CALORIES: ${meal.calories}, PROTEIN: ${meal.proteins}g, CARBS: ${meal.carbs}g, FATS: ${meal.fats}g

Provide step-by-step cooking instructions, pro tips, and serving suggestions.

Respond with ONLY valid JSON (no markdown):
{
  "instructions": [
    "Step 1: Description of first step",
    "Step 2: Description of second step",
    "Step 3: Continue with detailed steps..."
  ],
  "tips": [
    "Helpful tip 1",
    "Helpful tip 2"
  ],
  "servings": 1,
  "difficulty": "Easy/Medium/Hard",
  "nutritionBreakdown": {
    "calories": { "value": ${meal.calories}, "daily": ${Math.round((meal.calories / 2000) * 100)} },
    "proteins": { "value": ${meal.proteins}, "daily": ${Math.round((meal.proteins / 50) * 100)} },
    "carbs": { "value": ${meal.carbs}, "daily": ${Math.round((meal.carbs / 300) * 100)} },
    "fats": { "value": ${meal.fats}, "daily": ${Math.round((meal.fats / 65) * 100)} }
  }
}`;

    const data = await callGroqChat([
      {
        role: 'system',
        content: 'You are a professional chef and nutritionist. Provide detailed, practical cooking instructions. Always respond with valid JSON only.'
      },
      { role: 'user', content: prompt }
    ]);

    let textResponse = data.choices[0].message.content;
    textResponse = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const details = JSON.parse(textResponse);

    res.status(200).json({
      success: true,
      details: details
    });

  } catch (error) {
    console.error('Error generating meal details:', error);

    res.status(200).json({
      success: true,
      details: {
        instructions: [
          `Gather all ingredients: ${req.body.meal?.ingredients?.join(', ') || 'as listed'}`,
          'Prepare and wash all vegetables thoroughly',
          'Heat a pan or pot to medium heat with a little oil',
          'Cook the main protein until done (check internal temperature)',
          'Add vegetables and seasonings as needed',
          'Cook until everything is tender and well combined',
          'Adjust salt and spices to taste',
          'Serve hot and enjoy!'
        ],
        tips: [
          'Use fresh ingredients for best flavor',
          'Prep all ingredients before starting to cook',
          'Taste as you cook and adjust seasonings'
        ],
        servings: 1,
        difficulty: 'Medium',
        nutritionBreakdown: {
          calories: { value: req.body.meal?.calories || 400, daily: Math.round(((req.body.meal?.calories || 400) / 2000) * 100) },
          proteins: { value: req.body.meal?.proteins || 30, daily: Math.round(((req.body.meal?.proteins || 30) / 50) * 100) },
          carbs: { value: req.body.meal?.carbs || 40, daily: Math.round(((req.body.meal?.carbs || 40) / 300) * 100) },
          fats: { value: req.body.meal?.fats || 15, daily: Math.round(((req.body.meal?.fats || 15) / 65) * 100) }
        }
      }
    });
  }
});


module.exports = { userRouter };
