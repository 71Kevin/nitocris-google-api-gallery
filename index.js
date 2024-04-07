const express = require('express');
const path = require('path');
const { getNitocrisImages } = require('./src/lib/google');

class Server {
  constructor() {
    this.app = express();
    this.PORT = process.env.PORT || 3000;
    this.setup();
    this.routes();
    this.start();
  }

  setup() {
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'src/views'));
    this.app.use(express.static(path.join(__dirname, 'src/public')));
  }

  routes() {
    this.app.get('/', async (req, res) => {
      try {
        const images = await getNitocrisImages();
        res.render('index', { images });
      } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: error.message });
      }
    });
  }

  start() {
    this.app.listen(this.PORT, () => {
      console.log(`Server listening on port ${this.PORT}`);
    });
  }
}

new Server();
