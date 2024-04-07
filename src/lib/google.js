const axios = require('axios');
const cheerio = require('cheerio');

const getNitocrisImages = async () => {
  const nitocrisUrl =
    'https://www.google.com/search?q=fate+grand+order+nitocris+danbooru&tbm=isch&tbs=isz:l,ic:color,itp:photo';
  try {
    const response = await axios.get(nitocrisUrl);
    const $ = cheerio.load(response.data);
    const images = [];
    $('img').each((i, el) => {
      const imageSrc = $(el).attr('src');
      if (imageSrc && !imageSrc.endsWith('.gif')) {
        images.push(imageSrc);
      }
    });
    images.sort(() => Math.random() - 0.5);
    return images;
  } catch (error) {
    console.error(error);
    throw new Error('Unable to get Nitocris images.');
  }
};

module.exports = {
  getNitocrisImages,
};
