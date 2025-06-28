const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, walletAddress } = req.body;
    
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const newUser = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name, wallet_address, total_credits, total_value, monthly_offset, reduction_goal, token_balance, staking_rewards, reputation_score, achievements, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) RETURNING id, email, first_name, last_name, wallet_address',
      [email, hashedPassword, firstName, lastName, walletAddress, 0, 0, 0, 24, 0, 0, 50, []]
    );
    
    // Create user preferences
    await pool.query(
      'INSERT INTO user_preferences (user_id, location, lifestyle, budget, notifications, theme, preferences, risk_tolerance, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())',
      [newUser.rows[0].id, 'San Francisco, CA', ['urban', 'tech_worker'], 500, true, 'light', ['renewable_energy', 'forest_conservation'], 'medium']
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.rows[0].id, email: newUser.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        firstName: newUser.rows[0].first_name,
        lastName: newUser.rows[0].last_name,
        walletAddress: newUser.rows[0].wallet_address
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Get user preferences
    const preferencesResult = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [user.id]
    );
    
    const preferences = preferencesResult.rows[0] || null;
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        walletAddress: user.wallet_address,
        totalCredits: user.total_credits,
        totalValue: user.total_value,
        monthlyOffset: user.monthly_offset,
        reductionGoal: user.reduction_goal,
        tokenBalance: user.token_balance,
        stakingRewards: user.staking_rewards,
        reputationScore: user.reputation_score,
        achievements: user.achievements,
        preferences: preferences ? {
          location: preferences.location,
          lifestyle: preferences.lifestyle,
          budget: preferences.budget,
          notifications: preferences.notifications,
          theme: preferences.theme,
          preferences: preferences.preferences,
          riskTolerance: preferences.risk_tolerance
        } : null
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get user profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, wallet_address, total_credits, total_value, monthly_offset, reduction_goal, token_balance, staking_rewards, reputation_score, achievements FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get user preferences
    const preferencesResult = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    
    const preferences = preferencesResult.rows[0] || null;
    
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        walletAddress: user.wallet_address,
        totalCredits: user.total_credits,
        totalValue: user.total_value,
        monthlyOffset: user.monthly_offset,
        reductionGoal: user.reduction_goal,
        tokenBalance: user.token_balance,
        stakingRewards: user.staking_rewards,
        reputationScore: user.reputation_score,
        achievements: user.achievements,
        preferences: preferences ? {
          location: preferences.location,
          lifestyle: preferences.lifestyle,
          budget: preferences.budget,
          notifications: preferences.notifications,
          theme: preferences.theme,
          preferences: preferences.preferences,
          riskTolerance: preferences.risk_tolerance
        } : null
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Update user profile
app.patch('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, walletAddress } = req.body;
    
    // Update user
    const updateResult = await pool.query(
      'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), wallet_address = COALESCE($3, wallet_address), updated_at = NOW() WHERE id = $4 RETURNING id, email, first_name, last_name, wallet_address',
      [firstName, lastName, walletAddress, userId]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updateResult.rows[0].id,
        email: updateResult.rows[0].email,
        firstName: updateResult.rows[0].first_name,
        lastName: updateResult.rows[0].last_name,
        walletAddress: updateResult.rows[0].wallet_address
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Update user preferences
app.patch('/api/users/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { location, lifestyle, budget, notifications, theme, preferences, riskTolerance } = req.body;
    
    // Check if preferences exist
    const checkResult = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    
    if (checkResult.rows.length === 0) {
      // Create preferences if they don't exist
      await pool.query(
        'INSERT INTO user_preferences (user_id, location, lifestyle, budget, notifications, theme, preferences, risk_tolerance, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())',
        [userId, location, lifestyle, budget, notifications, theme, preferences, riskTolerance]
      );
    } else {
      // Update existing preferences
      await pool.query(
        'UPDATE user_preferences SET location = COALESCE($1, location), lifestyle = COALESCE($2, lifestyle), budget = COALESCE($3, budget), notifications = COALESCE($4, notifications), theme = COALESCE($5, theme), preferences = COALESCE($6, preferences), risk_tolerance = COALESCE($7, risk_tolerance), updated_at = NOW() WHERE user_id = $8',
        [location, lifestyle, budget, notifications, theme, preferences, riskTolerance, userId]
      );
    }
    
    // Get updated preferences
    const updatedResult = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    
    const updatedPreferences = updatedResult.rows[0];
    
    res.status(200).json({
      message: 'Preferences updated successfully',
      preferences: {
        location: updatedPreferences.location,
        lifestyle: updatedPreferences.lifestyle,
        budget: updatedPreferences.budget,
        notifications: updatedPreferences.notifications,
        theme: updatedPreferences.theme,
        preferences: updatedPreferences.preferences,
        riskTolerance: updatedPreferences.risk_tolerance
      }
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ error: 'Server error updating preferences' });
  }
});

// Carbon footprint calculation
app.post('/api/carbon/footprint', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { electricity, transportation, heating, airTravel, notes } = req.body;
    
    // Calculate total emissions
    const totalEmissions = calculateCarbonFootprint(electricity, transportation, heating, airTravel);
    
    // Save calculation
    const result = await pool.query(
      'INSERT INTO carbon_footprints (user_id, electricity, transportation, heating, air_travel, total_emissions, calculation_date, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, NOW(), NOW()) RETURNING *',
      [userId, electricity, transportation, heating, airTravel, totalEmissions, notes]
    );
    
    res.status(201).json({
      message: 'Carbon footprint calculated successfully',
      footprint: {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        electricity: result.rows[0].electricity,
        transportation: result.rows[0].transportation,
        heating: result.rows[0].heating,
        airTravel: result.rows[0].air_travel,
        totalEmissions: result.rows[0].total_emissions,
        calculationDate: result.rows[0].calculation_date,
        notes: result.rows[0].notes,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Carbon calculation error:', error);
    res.status(500).json({ error: 'Server error calculating carbon footprint' });
  }
});

// Get carbon footprint history
app.get('/api/carbon/footprint', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM carbon_footprints WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    const footprints = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      electricity: row.electricity,
      transportation: row.transportation,
      heating: row.heating,
      airTravel: row.air_travel,
      totalEmissions: row.total_emissions,
      calculationDate: row.calculation_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.status(200).json({ footprints });
  } catch (error) {
    console.error('Footprint history error:', error);
    res.status(500).json({ error: 'Server error fetching footprint history' });
  }
});

// Get latest carbon footprint
app.get('/api/carbon/footprint/latest', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM carbon_footprints WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No carbon footprint found' });
    }
    
    const footprint = {
      id: result.rows[0].id,
      userId: result.rows[0].user_id,
      electricity: result.rows[0].electricity,
      transportation: result.rows[0].transportation,
      heating: result.rows[0].heating,
      airTravel: result.rows[0].air_travel,
      totalEmissions: result.rows[0].total_emissions,
      calculationDate: result.rows[0].calculation_date,
      notes: result.rows[0].notes,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
    
    res.status(200).json({ footprint });
  } catch (error) {
    console.error('Latest footprint error:', error);
    res.status(500).json({ error: 'Server error fetching latest footprint' });
  }
});

// AI recommendations
app.post('/api/ai/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { carbonFootprint, location, lifestyle, preferences, budget } = req.body;
    
    // Generate mock recommendations
    const recommendations = generateMockRecommendations(carbonFootprint, budget);
    
    // Save recommendations to database
    const savedRecommendations = [];
    for (const rec of recommendations) {
      const result = await pool.query(
        'INSERT INTO ai_recommendations (user_id, type, title, description, impact, confidence, category, reward_potential, action_steps, estimated_cost, timeframe, priority, implemented, dismissed, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()) RETURNING *',
        [userId, rec.type, rec.title, rec.description, rec.impact, rec.confidence, rec.category, rec.rewardPotential, rec.actionSteps, rec.estimatedCost, rec.timeframe, rec.priority, false, false]
      );
      
      savedRecommendations.push({
        id: result.rows[0].id,
        type: result.rows[0].type,
        title: result.rows[0].title,
        description: result.rows[0].description,
        impact: result.rows[0].impact,
        confidence: result.rows[0].confidence,
        category: result.rows[0].category,
        rewardPotential: result.rows[0].reward_potential,
        actionSteps: result.rows[0].action_steps,
        estimatedCost: result.rows[0].estimated_cost,
        timeframe: result.rows[0].timeframe,
        priority: result.rows[0].priority,
        implemented: result.rows[0].implemented,
        dismissed: result.rows[0].dismissed,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      });
    }
    
    // Track AI usage
    await pool.query(
      'INSERT INTO ai_usage_metrics (user_id, model, request_type, tokens_used, response_time, success, fallback_used, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
      [userId, 'gpt-3.5-turbo', 'recommendations', 850, 1200, true, false]
    );
    
    res.status(201).json({
      message: 'Recommendations generated successfully',
      recommendations: savedRecommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Server error generating recommendations' });
  }
});

// Get AI recommendations
app.get('/api/ai/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, implemented, dismissed } = req.query;
    
    let query = 'SELECT * FROM ai_recommendations WHERE user_id = $1';
    const queryParams = [userId];
    
    if (type) {
      query += ' AND type = $' + (queryParams.length + 1);
      queryParams.push(type);
    }
    
    if (implemented !== undefined) {
      query += ' AND implemented = $' + (queryParams.length + 1);
      queryParams.push(implemented === 'true');
    }
    
    if (dismissed !== undefined) {
      query += ' AND dismissed = $' + (queryParams.length + 1);
      queryParams.push(dismissed === 'true');
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, queryParams);
    
    const recommendations = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      impact: row.impact,
      confidence: row.confidence,
      category: row.category,
      rewardPotential: row.reward_potential,
      actionSteps: row.action_steps,
      estimatedCost: row.estimated_cost,
      timeframe: row.timeframe,
      priority: row.priority,
      implemented: row.implemented,
      dismissed: row.dismissed,
      implementationNotes: row.implementation_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.status(200).json({ recommendations });
  } catch (error) {
    console.error('Recommendations fetch error:', error);
    res.status(500).json({ error: 'Server error fetching recommendations' });
  }
});

// Implement recommendation
app.patch('/api/ai/recommendations/:id/implement', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const recommendationId = req.params.id;
    const { notes } = req.body;
    
    const result = await pool.query(
      'UPDATE ai_recommendations SET implemented = true, implementation_notes = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [notes, recommendationId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    
    const recommendation = {
      id: result.rows[0].id,
      type: result.rows[0].type,
      title: result.rows[0].title,
      description: result.rows[0].description,
      impact: result.rows[0].impact,
      confidence: result.rows[0].confidence,
      category: result.rows[0].category,
      rewardPotential: result.rows[0].reward_potential,
      actionSteps: result.rows[0].action_steps,
      estimatedCost: result.rows[0].estimated_cost,
      timeframe: result.rows[0].timeframe,
      priority: result.rows[0].priority,
      implemented: result.rows[0].implemented,
      dismissed: result.rows[0].dismissed,
      implementationNotes: result.rows[0].implementation_notes,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
    
    res.status(200).json({
      message: 'Recommendation implemented successfully',
      recommendation
    });
  } catch (error) {
    console.error('Recommendation implementation error:', error);
    res.status(500).json({ error: 'Server error implementing recommendation' });
  }
});

// Dismiss recommendation
app.patch('/api/ai/recommendations/:id/dismiss', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const recommendationId = req.params.id;
    
    const result = await pool.query(
      'UPDATE ai_recommendations SET dismissed = true, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [recommendationId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    
    const recommendation = {
      id: result.rows[0].id,
      type: result.rows[0].type,
      title: result.rows[0].title,
      description: result.rows[0].description,
      impact: result.rows[0].impact,
      confidence: result.rows[0].confidence,
      category: result.rows[0].category,
      rewardPotential: result.rows[0].reward_potential,
      actionSteps: result.rows[0].action_steps,
      estimatedCost: result.rows[0].estimated_cost,
      timeframe: result.rows[0].timeframe,
      priority: result.rows[0].priority,
      implemented: result.rows[0].implemented,
      dismissed: result.rows[0].dismissed,
      implementationNotes: result.rows[0].implementation_notes,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
    
    res.status(200).json({
      message: 'Recommendation dismissed successfully',
      recommendation
    });
  } catch (error) {
    console.error('Recommendation dismissal error:', error);
    res.status(500).json({ error: 'Server error dismissing recommendation' });
  }
});

// Get AI metrics
app.get('/api/ai/metrics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get usage metrics
    const metricsResult = await pool.query(
      'SELECT * FROM ai_usage_metrics WHERE user_id = $1 AND created_at >= $2 ORDER BY created_at DESC',
      [userId, startDate.toISOString()]
    );
    
    // Calculate summary statistics
    const totalRequests = metricsResult.rows.length;
    const successfulRequests = metricsResult.rows.filter(m => m.success).length;
    const fallbackUsage = metricsResult.rows.filter(m => m.fallback_used).length;
    const totalTokens = metricsResult.rows.reduce((sum, m) => sum + (m.tokens_used || 0), 0);
    const avgResponseTime = totalRequests > 0 
      ? metricsResult.rows.reduce((sum, m) => sum + (m.response_time || 0), 0) / totalRequests 
      : 0;
    
    // Group by request type
    const requestTypes = metricsResult.rows.reduce((acc, m) => {
      acc[m.request_type] = (acc[m.request_type] || 0) + 1;
      return acc;
    }, {});
    
    // Get cost metrics
    const costResult = await pool.query(
      'SELECT * FROM ai_cost_tracking WHERE user_id = $1 AND date >= $2 ORDER BY date DESC',
      [userId, startDate.toISOString().split('T')[0]]
    );
    
    // Calculate cost summary
    const totalCost = costResult.rows.reduce((sum, m) => sum + parseFloat(m.cost), 0);
    const costByModel = costResult.rows.reduce((acc, m) => {
      acc[m.model] = (acc[m.model] || 0) + parseFloat(m.cost);
      return acc;
    }, {});
    
    res.status(200).json({
      metrics: {
        usage: {
          metrics: metricsResult.rows,
          summary: {
            totalRequests,
            successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
            fallbackRate: totalRequests > 0 ? (fallbackUsage / totalRequests) * 100 : 0,
            totalTokens,
            avgResponseTime,
            requestTypes
          }
        },
        cost: {
          costs: costResult.rows,
          summary: {
            totalCost,
            costByModel,
            avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0
          }
        }
      }
    });
  } catch (error) {
    console.error('AI metrics error:', error);
    res.status(500).json({ error: 'Server error fetching AI metrics' });
  }
});

// Helper function to calculate carbon footprint
function calculateCarbonFootprint(electricity, transportation, heating, airTravel) {
  // Carbon footprint calculation factors (tons CO2 per unit)
  const factors = {
    electricity: 0.0005, // per kWh
    transportation: 0.0004, // per mile
    heating: 0.0053, // per therm
    airTravel: 0.9, // per flight
  };

  return (
    electricity * factors.electricity +
    transportation * factors.transportation +
    heating * factors.heating +
    airTravel * factors.airTravel
  );
}

// Helper function to generate mock recommendations
function generateMockRecommendations(carbonFootprint, budget = 500) {
  return [
    {
      type: 'reduction',
      title: 'Optimize Home Energy Usage',
      description: 'Implement smart energy management practices to reduce your carbon footprint',
      impact: 3.2,
      confidence: 90,
      category: 'Energy Efficiency',
      rewardPotential: 32,
      actionSteps: [
        'Install a programmable thermostat',
        'Switch to LED lighting throughout your home',
        'Unplug electronics when not in use',
        'Use energy-efficient appliances'
      ],
      estimatedCost: 300,
      timeframe: '2-4 weeks',
      priority: 'medium'
    },
    {
      type: 'behavioral',
      title: 'Sustainable Transportation',
      description: 'Reduce transportation emissions through smart mobility choices',
      impact: 4.8,
      confidence: 85,
      category: 'Transportation',
      rewardPotential: 48,
      actionSteps: [
        'Use public transportation or carpool when possible',
        'Walk or bike for trips under 2 miles',
        'Combine errands into single trips',
        'Consider electric or hybrid vehicle for next purchase'
      ],
      estimatedCost: 0,
      timeframe: '1-2 weeks',
      priority: 'high'
    },
    {
      type: 'purchase',
      title: 'Invest in Carbon Credits',
      description: 'Purchase verified carbon credits to offset your remaining emissions',
      impact: 5.5,
      confidence: 80,
      category: 'Carbon Offsetting',
      rewardPotential: 55,
      actionSteps: [
        'Calculate your annual carbon footprint',
        'Research verified carbon credit projects',
        'Purchase credits from reputable providers',
        'Track and verify your offset impact'
      ],
      estimatedCost: budget,
      timeframe: '1 week',
      priority: 'high'
    }
  ];
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});