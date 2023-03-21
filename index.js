const express = require('express');
const path = require('path');

const { getNitocrisImages } = require('./src/lib/google');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

app.get('/', async (req, res) => {
  try {
    const images = await getNitocrisImages();
    res.render('index', { images });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
