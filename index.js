const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express();
const authenticateJWT = require("./middlewares/authenticateJWT");
const e = require("express");
const allowedTo = require("./middlewares/allowedTo");
const paginate = require("./helpers/paginate");
const calculateNumberOfPage = require("./helpers/calculateNumberOfPage");
const users = require("./data").userDB;
const restaurants = require("./data").restaurantsDB;
const uploadPhotos = require("./middlewares/uploadPhotos");
const fs = require("fs");
const { bookingsDB, userDB, reviewsDB } = require("./data");
const calculateAverageRating = require("./helpers/calculateAverageRating");
// const fetchRestaurantReviews = require("./helpers/fetchRestaurantReviews");

require("dotenv").config();

const port = 3100;

app.use(express.static(`${__dirname}/public`));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

process.on("uncaughtException", function (err) {
  console.log(err);
});

function generateId(items) {
  const maxId = items.reduce((maxId, todo) => Math.max(todo.id, maxId), -1);
  return maxId + 1;
}

app.get("/", (req, res) => {
  res.send("test");
});

app.post("/register", async (req, res) => {
  try {
    let foundUser = users.find((data) => req.body.email === data.email);
    if (!foundUser) {
      let hashPassword = await bcrypt.hash(req.body.password, 10);

      let newUser = {
        id: generateId(users),
        name: req.body.fullname,
        email: req.body.email,
        password: hashPassword,
        accountType: req.body.role,
      };
      users.push(newUser);

      res.status(200).json({ newUser });
    } else {
      res.status(401).json({ message: "Email is existed" });
    }
  } catch (error) {
    res.status(500).json({ message: error.toString() });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    let foundUser = users.find((data) => email === data.email);
    if (!foundUser) return res.status(404).json("Account does not exist");
    const passwordValid = await bcrypt.compare(password, foundUser.password);
    if (!passwordValid) {
      return res
        .status(401)
        .json({ message: "Incorrect email and password combination" });
    }

    // Nếu okay:
    const accessToken = jwt.sign(
      {
        id: foundUser.id,
        role: foundUser.accountType,
        name: foundUser.name,
        email: foundUser.email,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "180 days" }
    );

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(500).json({ message: error.toString() });
  }
});

// http://localhost:3100/accounts?name=&email=&accountType
app.get(
  "/accounts",
  authenticateJWT,
  allowedTo(["admin"]),
  async (req, res) => {
    const { search, current_page_number = 1 } = req.query;
    const PER_PAGE = 3;
    let current_page = current_page_number;

    let accounts = users.map((user) => {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
      };
    });

    if (search) {
      accounts = accounts.filter(
        (user) =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          user.accountType.toLowerCase().includes(search.toLowerCase())
      );
      current_page = 1;
    }

    let numberOfPage = calculateNumberOfPage(accounts.length, PER_PAGE);
    accounts = paginate(accounts, PER_PAGE, current_page);

    res.status(200).json({
      accounts,
      numberOfPage,
    });
  }
);

app.get("/current-user", authenticateJWT, (req, res) => {
  if (req.user) {
    calculateAverageRating();
    let user = req.user;
    if (req.user.role === "owner") {
      let restaurantOwnedId = null;
      restaurants.forEach(function (item) {
        if (item.userId === user.id) restaurantOwnedId = item.id;
      });
      user.restaurantOwnedId = restaurantOwnedId;
    } else {
      user.restaurantOwnedId = null;
    }
    res.status(200).json(user);
  } else res.status(500).json({ message: "Cannot load user" });
});

// localhost:3100/accounts/1 -> GET
app.get("/accounts/:id", authenticateJWT, allowedTo(["admin"]), (req, res) => {
  const { id } = req.params;
  const foundUser = users.find((user) => user.id === Number(id));
  if (foundUser) {
    const user = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      accountType: foundUser.accountType,
    };
    res.status(200).json(user);
  } else {
    res.status(500).json({ message: "Cannot load user" });
  }
});

app.post(
  "/edit-user",
  authenticateJWT,
  allowedTo(["admin"]),
  async (req, res) => {
    try {
      const { fullname, email, id } = req.body;
      const foundUser = users.find((user) => user.id === Number(id));
      if (foundUser) {
        const emailExisted = users.some(
          (u) => u.id != Number(id) && u.email === email
        );
        if (emailExisted)
          return res.status(500).json({
            message: "Email is already existed. Please choose another email",
          });
        foundUser.name = fullname || foundUser.name;
        foundUser.email = email || foundUser.email;

        res.status(200).json({ foundUser });
      } else {
        res.status(500).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.toString() });
    }
  }
);

app.post("/reset-password", authenticateJWT, async (req, res) => {
  try {
    const { password, id } = req.body;
    const foundUser = users.find((user) => user.id === Number(id));
    if (foundUser) {
      if (password) {
        let hashPassword = await bcrypt.hash(password, 10);
        foundUser.password = hashPassword;
      }

      res.status(200).json({ message: "Update password successfully" });
    } else {
      res.status(500).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.toString() });
  }
});

// localhost:3100/accounts/1 -> DELETE
app.delete(
  "/accounts/:id",
  authenticateJWT,
  allowedTo(["admin"]),
  (req, res) => {
    const { id } = req.params;
    let deletedIndex = null;
    const deletedItem = users.find((item, index) => {
      if (item.id === Number(id)) {
        deletedIndex = index;
        return true;
      }
      return false;
    });

    if (deletedItem) {
      users.splice(deletedIndex, 1);
      res.json(deletedItem);
    } else {
      res.sendStatus(404);
    }
  }
);

app.post(
  "/add-restaurant",
  authenticateJWT,
  allowedTo(["admin", "owner"]),
  async (req, res) => {
    try {
      const {
        restaurantName,
        address,
        barseat,
        tablefor2,
        tablefor4,
        tablefor6,
        tablefor10,
        tablefor12,
        userId,
      } = req.body;

      let newRestaurant = {
        id: generateId(restaurants),
        restaurantName: restaurantName,
        address: address,
        barseat: barseat,
        tablefor2: tablefor2,
        tablefor4: tablefor4,
        tablefor6: tablefor6,
        tablefor10: tablefor10,
        tablefor12: tablefor12,
        files: [],
        userId: userId,
      };
      restaurants.push(newRestaurant);

      res.status(200).json({ newRestaurant });
    } catch (error) {
      res.status(500).json({ message: error.toString() });
    }
  }
);

app.post(
  "/upload-restaurant-photos/:id",
  authenticateJWT,
  uploadPhotos,
  (req, res) => {
    try {
      const { id } = req.params;
      const files = req.files;
      const foundRestaurant = restaurants.find((res) => res.id === Number(id));
      if (foundRestaurant) {
        files.forEach((file) => {
          foundRestaurant.files.push(
            `http://localhost:3100/uploads/${file.filename}`
          );
        });
        res.status(200).json({ restaurantId: foundRestaurant.id });
      } else {
        res.status(500).json({ message: "Restaurant not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.toString() });
    }
  }
);

app.post(
  "/edit-restaurant",
  authenticateJWT,
  allowedTo(["admin", "owner"]),
  async (req, res) => {
    try {
      const {
        restaurantName,
        address,
        barseat,
        tablefor2,
        tablefor4,
        tablefor6,
        tablefor10,
        tablefor12,
      } = req.body;
      const foundRestaurant = restaurants.find(
        (res) => res.userId === req.user.id
      );
      if (foundRestaurant) {
        foundRestaurant.restaurantName =
          restaurantName || foundRestaurant.restaurantName;
        foundRestaurant.address = address || foundRestaurant.address;
        foundRestaurant.barseat = barseat || foundRestaurant.barseat;
        foundRestaurant.tablefor2 = tablefor2 || foundRestaurant.tablefor2;
        foundRestaurant.tablefor4 = tablefor4 || foundRestaurant.tablefor4;
        foundRestaurant.tablefor6 = tablefor6 || foundRestaurant.tablefor6;
        foundRestaurant.tablefor10 = tablefor10 || foundRestaurant.tablefor10;
        foundRestaurant.tablefor12 = tablefor12 || foundRestaurant.tablefor12;

        res.status(200).json({ foundRestaurant });
      } else {
        res.status(500).json({ message: "Restaurant not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.toString() });
    }
  }
);

// localhost:3100/restaurants/1 -> GET
app.get("/restaurants/:id", authenticateJWT, (req, res) => {
  const { id } = req.params;
  const foundRestaurant = restaurants.find((res) => res.id === Number(id));
  if (foundRestaurant) {
    res.status(200).json(foundRestaurant);
  } else {
    res.status(500).json({ message: "Cannot load restaurant" });
  }
});

app.get(
  "/restaurant-photos/:id",
  authenticateJWT,
  allowedTo(["admin", "owner"]),
  (req, res) => {
    const { id } = req.params;
    const foundRestaurant = restaurants.find((res) => res.id === Number(id));
    if (foundRestaurant) {
      res.status(200).json(foundRestaurant.files);
    } else {
      res.status(500).json({ message: "Cannot load photos" });
    }
  }
);

app.delete(
  "/photos/:id",
  authenticateJWT,
  allowedTo(["admin", "owner"]),
  (req, res) => {
    try {
      const { id } = req.params;
      const foundRestaurant = restaurants.find((res) => res.id === Number(id));
      if (foundRestaurant) {
        const { path } = req.body;
        let deletedIndex = null;
        const deletedItem = foundRestaurant.files.find((item, index) => {
          if (item === path) {
            deletedIndex = index;
            return true;
          }
          return false;
        });

        if (deletedItem) {
          foundRestaurant.files.splice(deletedIndex, 1);
          res.json(deletedItem);
        } else {
          res.sendStatus(404);
        }
      }
    } catch (error) {
      res.status(500).json({ message: error.toString() });
    }
  }
);

app.get(
  "/customer-bookings",
  authenticateJWT,
  allowedTo(["customer", "admin"]),
  (req, res) => {
    let user = req.user;
    const foundBookings = bookingsDB.reverse()
      .map((booking) => {
        if (booking.userId === user.id) {
          let restaurant = restaurants.find(
            (res) => res.id === booking.restauranId
          );
          booking.name = restaurant.restaurantName;
          return booking;
        }
      })
      .filter((i) => i);
    if (foundBookings) {
      res.status(200).json(foundBookings);
    } else {
      res.status(500).json({ message: "Cannot find any booking" });
    }
  }
);

app.get(
  "/restaurant-bookings",
  authenticateJWT,
  allowedTo(["owner", "admin"]),
  (req, res) => {
    try {
      let owner = req.user;
      const foundRestaurant = restaurants.find(
        (res) => res.userId === owner.id
      );
      if (foundRestaurant) {
        const foundBookings = bookingsDB
          .map((booking) => {
            if (booking.restauranId === foundRestaurant.id) {
              const customerName = userDB.find(
                (u) => u.id === booking.userId
              ).name;
              booking.name = customerName;
              return booking;
            }
          })
          .filter((i) => i);
        if (foundBookings) {
          res.status(200).json(foundBookings);
        } else {
          res.status(500).json({ message: "Cannot find any booking" });
        }
      } else {
        res.status(500).json({ message: "Restaurant is not existed" });
      }
    } catch (error) {
      res.status(500).json({ message: "Cannot find any booking" });
    }
  }
);

app.delete("/booking/:id", authenticateJWT, (req, res) => {
  const { id } = req.params;
  const deletedItem = bookingsDB.find((item, index) => {
    if (item.id === Number(id)) {
      deletedIndex = index;
      return true;
    }
    return false;
  });

  if (deletedItem) {
    bookingsDB.splice(deletedIndex, 1);
    res.json(deletedItem);
  } else {
    res.sendStatus(404);
  }
});

app.get(
  "/reviews",
  authenticateJWT,
  allowedTo(["admin", "owner"]),
  async (req, res) => {
    const { search, reviewSearch, current_page_number = 1 } = req.query;
    const PER_PAGE = 3;
    let current_page = current_page_number;

    const foundRestaurant = restaurants.find(
      (res) => res.userId === req.user.id
    );

    let foundReviews = reviewsDB
      .map((review) => {
        if (review.restauranId === foundRestaurant.id) {
          const customerName = userDB.find((u) => u.id === review.userId).name;
          review.name = customerName;
          return review;
        }
      })
      .filter((i) => i);

    if (search) {
      foundReviews = foundReviews.filter(
        (review) =>
          review.name.toLowerCase().includes(search.toLowerCase()) ||
          review.content.toLowerCase().includes(search.toLowerCase())
      );
      current_page = 1;
    }

    if (reviewSearch) {
      foundReviews = foundReviews.filter(
        (review) => review.rating === Number(reviewSearch)
      );
      current_page = 1;
    }
    let numberOfPage = calculateNumberOfPage(foundReviews.length, PER_PAGE);
    foundReviews = paginate(foundReviews, PER_PAGE, current_page);

    res.status(200).json({
      foundReviews,
      numberOfPage,
    });
  }
);

app.post("/edit-booking", authenticateJWT, async (req, res) => {
  try {
    const { id, people, date, time } = req.body;
    const foundBooking = bookingsDB.find((booking) => booking.id === id);
    if (foundBooking) {
      foundBooking.size = people || foundBooking.size;
      foundBooking.date = date || foundBooking.date;
      foundBooking.time = time || foundBooking.time;
      res.status(200).json({ foundBooking });
    } else {
      res.status(500).json({ message: "Booking not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.toString() });
  }
});

app.get("/restaurant-list", authenticateJWT, (req, res) => {
  try {
    const { searchName, searchAddress, reviewSearch } = req.query;
    let foundRestaurants = [...restaurants];

    if (searchName) {
      foundRestaurants = foundRestaurants.filter((restaurant) =>
        restaurant.restaurantName
          .toLowerCase()
          .includes(searchName.toLowerCase())
      );
    }
    if (searchAddress) {
      foundRestaurants = foundRestaurants.filter((restaurant) =>
        restaurant.address.toLowerCase().includes(searchAddress.toLowerCase())
      );
    }

    if (reviewSearch) {
      foundRestaurants = foundRestaurants.filter(
        (restaurant) => Math.round(restaurant.rating) === Number(reviewSearch)
      );
    }
    if (foundRestaurants.length > 0) {
      res.status(200).json(foundRestaurants);
    } else res.status(200).json([]);
  } catch (error) {
    res.status(500).json({ message: "Cannot find any booking" });
  }
});

app.post(
  "/add-booking",
  authenticateJWT,
  allowedTo(["admin", "customer"]),
  async (req, res) => {
    try {
      const { people, date, time, userId, restaurantId } = req.body;
      let newBooking = {
        id: generateId(bookingsDB),
        restauranId: restaurantId,
        date: date,
        time: time,
        size: Number(people),
        userId: userId,
      };
      bookingsDB.push(newBooking);
      res.status(200).json({ newBooking });
    } catch (error) {
      res.status(500).json({ message: error.toString() });
    }
  }
);

app.get("/reviews-on-customer-side", authenticateJWT, async (req, res) => {
  const { restauranId } = req.query;

  let foundReviews = reviewsDB
    .map((review) => {
      if (review.restauranId === Number(restauranId)) {
        const customerName = userDB.find((u) => u.id === review.userId).name;
        review.name = customerName;
        return review;
      }
    })
    .filter((i) => i);

  res.status(200).json({
    foundReviews,
  });
});

app.get("/reviews-on-booking-id", authenticateJWT, async (req, res) => {
  const { bookingId } = req.query;
  let foundReview = reviewsDB
    .find((review) => review.bookingId === Number(bookingId));
  res.status(200).json({ foundReview });
});

app.post(
  "/add-review",
  authenticateJWT,
  allowedTo(["admin", "customer"]),
  async (req, res) => {
    try {
      const { review, rating, restauranId, dateTime, bookingId } = req.body;
      let user = req.user;
      let newReview = {
        id: generateId(reviewsDB),
        userId: user.id,
        datetime: dateTime,
        content: review,
        rating: rating,
        restauranId: restauranId,
        bookingId: bookingId

      };
      reviewsDB.push(newReview);
      res.status(200).json({ newReview });
    } catch (error) {
      res.status(500).json({ message: error.toString() });
    }
  }
);

app.listen(port, () => {
  console.log(`Restaurant booking app listening on port ${port}`);
});
