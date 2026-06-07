const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/data', async (req, res) => {
  const response = await axios.get('https://api.example.com');
  res.json(response.data);
});

module.exports = router;