import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Allow requests from your front-end
app.use(cors());

app.get('/planes', async (req, res) => {
  try {
    const url = 'https://api.adsb.lol/v2/lat/39.7684/lon/-86.1581/dist/100';
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch planes' });
  }
});

app.listen(PORT, () =>
  console.log(`Proxy running at http://localhost:${PORT}`)
);
