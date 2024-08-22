const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Creating shortUrl
app.post('/shorten', async (req, res) => {
  const { originalUrl, visitLimit } = req.body;

  // Validate input
  if (!originalUrl || typeof originalUrl !== 'string') {
    return res.status(400).json({ error: 'Original URL is required and must be a string' });
  }

  // Visit limit unlimited
  const limit = visitLimit !== undefined ? visitLimit : null;

  // Generating unique shortUrl
  const shortUrl = crypto.randomBytes(4).toString('hex');

  const { data, error } = await supabase
    .from('urls')
    .insert([{ originalUrl, visitLimit: limit, shortUrl, visitCount: 0 }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ shortUrl: data[0].shortUrl });
});

// Redirecting to the original URL
app.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  const { data, error } = await supabase
    .from('urls')
    .select('*')
    .eq('shortUrl', shortUrl)
    .single();

  if (error || !data) {
    return res.status(404).send('URL not found');
  }

  // Check if the visit limit is reached
  if (data.visitLimit !== null && data.visitCount >= data.visitLimit) {
    return res.status(410).send('URL expired');
  }

  const { error: updateError } = await supabase
    .from('urls')
    .update({ visitCount: data.visitCount + 1 })
    .eq('shortUrl', shortUrl);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  res.redirect(data.originalUrl);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
