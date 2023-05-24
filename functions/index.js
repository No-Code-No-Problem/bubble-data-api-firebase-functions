const {onRequest} = require("firebase-functions/v2/https");

const bubbleBaseDataURL  = process.env.BUBBLE_DATA_URL;
const bubbleApiKey = process.env.BUBBLE_API_KEY;

const ConstraintsBuilder = require('./BubbleConstraintsBuilder.js');

const BubbleDataClient = require('./BubbleDataClient.js');
const bubbleApiClient = new BubbleDataClient(bubbleBaseDataURL, bubbleApiKey);

exports.helloworld = onRequest(async (request, response) => {
    // Fetch all articles
    const allArticles = await bubbleApiClient.getThings('Article', fetchAll=true);

    // Take first article and update it
    var firstArticle = allArticles.response.results[0];

    // Update the article
    const res = await bubbleApiClient.updateThing('Article', firstArticle._id, { title: "Updated Title", body: "Updated Body"});

    // Fetch updated version
    const idConstraints = new ConstraintsBuilder().addConstraint("_id", "equals", firstArticle._id).build();
    const updatedThing = await bubbleApiClient.getThings('Article', idConstraints, fetchAll=true);
    
    response.json({ ...res, updatedThing: updatedThing.response.results[0] });
});

function generateRandomArticles(count) {
  const articles = [];
  for (let i = 0; i < count; i++) {
      const title = "New Article " + Math.floor(Math.random() * 1000);
      const data = {
          title: title,
          body: `This is the content of ${title}`
      };
      articles.push(data);
  }
  return articles;
}