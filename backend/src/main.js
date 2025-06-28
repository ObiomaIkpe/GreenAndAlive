#!/usr/bin/env node
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database connection
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  console.log('Database connection initialized');
} catch (error) {
  console.error('Database connection error:', error);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'CarbonledgerAI Backend API', 
    version: '1.0.0',
    status: 'running' 
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name',
      [email, hashedPassword, firstName, lastName]
    );
    
    const user = result.rows[0];
    
    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
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
        achievements: user.achievements
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User routes
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get user preferences
    const preferencesResult = await pool.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]);
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
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Carbon footprint routes
app.post('/api/carbon/footprint', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { electricity, transportation, heating, airTravel, notes } = req.body;
    
    // Calculate total emissions
    const totalEmissions = calculateCarbonFootprint({
      electricity,
      transportation,
      heating,
      airTravel
    });
    
    // Save footprint
    const result = await pool.query(
      `INSERT INTO carbon_footprints 
       (user_id, electricity, transportation, heating, air_travel, total_emissions, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [userId, electricity, transportation, heating, airTravel, totalEmissions, notes]
    );
    
    const footprint = result.rows[0];
    
    res.status(201).json({
      message: 'Carbon footprint calculated successfully',
      footprint: {
        id: footprint.id,
        userId: footprint.user_id,
        electricity: footprint.electricity,
        transportation: footprint.transportation,
        heating: footprint.heating,
        airTravel: footprint.air_travel,
        totalEmissions: footprint.total_emissions,
        calculationDate: footprint.calculation_date,
        notes: footprint.notes,
        createdAt: footprint.created_at,
        updatedAt: footprint.updated_at
      }
    });
  } catch (error) {
    console.error('Carbon footprint calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/carbon/footprint', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get footprint history
    const result = await pool.query(
      'SELECT * FROM carbon_footprints WHERE user_id = $1 ORDER BY calculation_date DESC',
      [userId]
    );
    
    const footprints = result.rows.map(fp => ({
      id: fp.id,
      userId: fp.user_id,
      electricity: fp.electricity,
      transportation: fp.transportation,
      heating: fp.heating,
      airTravel: fp.air_travel,
      totalEmissions: fp.total_emissions,
      calculationDate: fp.calculation_date,
      notes: fp.notes,
      createdAt: fp.created_at,
      updatedAt: fp.updated_at
    }));
    
    res.status(200).json({
      footprints
    });
  } catch (error) {
    console.error('Get footprint history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/carbon/footprint/latest', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get latest footprint
    const result = await pool.query(
      'SELECT * FROM carbon_footprints WHERE user_id = $1 ORDER BY calculation_date DESC LIMIT 1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No carbon footprint found' });
    }
    
    const fp = result.rows[0];
    
    res.status(200).json({
      footprint: {
        id: fp.id,
        userId: fp.user_id,
        electricity: fp.electricity,
        transportation: fp.transportation,
        heating: fp.heating,
        airTravel: fp.air_travel,
        totalEmissions: fp.total_emissions,
        calculationDate: fp.calculation_date,
        notes: fp.notes,
        createdAt: fp.created_at,
        updatedAt: fp.updated_at
      }
    });
  } catch (error) {
    console.error('Get latest footprint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI recommendations routes
app.get('/api/ai/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, implemented, dismissed } = req.query;
    
    // Build query
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
    
    // Get recommendations
    const result = await pool.query(query, queryParams);
    
    const recommendations = result.rows.map(rec => ({
      id: rec.id,
      type: rec.type,
      title: rec.title,
      description: rec.description,
      impact: rec.impact,
      confidence: rec.confidence,
      category: rec.category,
      rewardPotential: rec.reward_potential,
      actionSteps: rec.action_steps,
      estimatedCost: rec.estimated_cost,
      timeframe: rec.timeframe,
      priority: rec.priority,
      implemented: rec.implemented,
      dismissed: rec.dismissed,
      implementationNotes: rec.implementation_notes,
      createdAt: rec.created_at,
      updatedAt: rec.updated_at
    }));
    
    res.status(200).json({
      recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
function calculateCarbonFootprint(data) {
  // Carbon footprint calculation factors (tons CO2 per unit)
  const factors = {
    electricity: 0.0005, // per kWh
    transportation: 0.0004, // per mile
    heating: 0.0053, // per therm
    airTravel: 0.9, // per flight
  };

  return (
    data.electricity * factors.electricity +
    data.transportation * factors.transportation +
    data.heating * factors.heating +
    data.airTravel * factors.airTravel
  );
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;