const { reviewsDB } = require("../data");

const {restaurantsDB} = require("../data");


const calculateAverageRating = () => {
    for (let item = 0; item < restaurantsDB.length; item++) {
        let reviews = reviewsDB.filter(review=>review.restauranId === restaurantsDB[item].id);
        
        let getRating = reviews.map(getReviews);
        let ratingTotal = getRating.reduce(addRating, 0);
        let average = ratingTotal / getRating.length;
        if(!average) average = 0;
        restaurantsDB[item].rating = average;
    }
}

module.exports = calculateAverageRating;



function getReviews(item) {
    return item.rating;
}
function addRating(runningTotal, value) {
    return runningTotal + value;
}