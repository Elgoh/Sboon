const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>
  res.render('dashboard', {
    user: req.user
  })
);

// Gameboard
router.get('/gameboard', ensureAuthenticated, (req, res) =>
  res.render('gameboard', {
    user: req.user
  })
);

module.exports = router;