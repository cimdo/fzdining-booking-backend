const bcrypt = require("bcrypt");

const userDB = [
  {
    id: 0,
    name: "Emily Johnson",
    email: "emily.johnson@email.com",
    accountType: "admin",
    password: bcrypt.hashSync("XQKdaFrT", 10),
  },
  {
    id: 1,
    name: "Anna Nguyen",
    email: "annanguyen@mail.com",
    accountType: "customer",
    password:  bcrypt.hashSync("SecurePass123", 10),
  },
  {
    id: 2,
    name: "Jayden Carter",
    email: "jaydencarter@gmail.com",
    accountType: "owner",
    password: bcrypt.hashSync("SafePwd987", 10),
  },
  {
    id: 3,
    name: "Evelyn South",
    email: "evesouth@gmail.com",
    accountType: "owner",
    password: bcrypt.hashSync("HiddenPass456", 10),
  },
  {
    id: 4,
    name: "Noah White",
    email: "noah.white@email.com",
    accountType: "admin",
    password: bcrypt.hashSync("Secure1234$@", 10),
  },
  {
    id: 5,
    name: " Liam Taylor",
    email: "liam.taylor@email.com",
    accountType: "admin",
    password: bcrypt.hashSync("Hidden123Pwd", 10),
  },
  {
    id: 6,
    name: "Alex Rodriguez",
    email: "alex.rodriguez@email.com",
    accountType: "owner",
    password: bcrypt.hashSync("SecurePwd456", 10),
  },
  {
    id: 7,
    name: "Jackson Brown",
    email: "jackson.brown@email.com",
    accountType: "customer",
    password: bcrypt.hashSync("ProtectedPwd789!", 10),
  },
  {
    id: 8,
    name: "Sophia Davis",
    email: "sophia.davis@email.com",
    accountType: "admin",
    password: bcrypt.hashSync("WqyHNeMpbdxmsDWFiUfq", 10),
  },
  {
    id: 9,
    name: "Ethan Williams",
    email: "ethan.williams@email.com",
    accountType: "customer",
    password: bcrypt.hashSync("SafePwd987", 10),
  },

];

const restaurantsDB = [
  {
    id:0,
    restaurantName:"La Vista Village",
    address:"89 John street, Lavista NSW 2232 ",
    barseat:2,
    tablefor2:2,
    tablefor4:2,
    tablefor6:2,
    tablefor10:3,
    tablefor12:3,
    files: ['http://localhost:3100/uploads/italian.jpeg'], 
    userId: 2
  },
  {
    id:1,
    restaurantName:"Rose Thai",
    address:"83 Linden street, Alice Spring VIC 2333 ",
    barseat:3,
    tablefor2:2,
    tablefor4:2,
    tablefor6:5,
    tablefor10:3,
    tablefor12:3,
    files: ['http://localhost:3100/uploads/japan.jpeg'], 
    userId: 3
  },
  {
    id:2,
    restaurantName:"Sushi Train",
    address:"11A Breaside Avenue, Adelaide SA 3123 ",
    barseat:3,
    tablefor2:2,
    tablefor4:2,
    tablefor6:6,
    tablefor10:3,
    tablefor12:4,
    files: ['http://localhost:3100/uploads/finedining.jpeg'], 
    userId: 6
  },
  {
    id:3,
    restaurantName:"Domino",
    address:"15 Branch Avenue, Sydney NSW 2000 ",
    barseat:4,
    tablefor2:2,
    tablefor4:2,
    tablefor6:1,
    tablefor10:3,
    tablefor12:2,
    files: ['http://localhost:3100/uploads/therock.jpeg'], 
    userId: 6
  },
  {
    id:4,
    restaurantName:"Chinese Foodie",
    address:"1A Princes Hway, Sydney NSW 2000 ",
    barseat:4,
    tablefor2:2,
    tablefor4:2,
    tablefor6:1,
    tablefor10:3,
    tablefor12:2,
    files: [], 
    userId: 6
  },
]


const bookingsDB = [
  {
    id:0,
    restauranId:0,
    date:"2023-11-25",
    time: "01:15",
    size: 2,
    userId: 1
  },
  {
    id:1,
    restauranId:0,
    date:"2021-01-05",
    time: "19:15",
    size: 4,
    userId: 1
  },
  {
    id:2,
    restauranId:0,
    date:"2025-07-03",
    time: "21:15",
    size: 4,
    userId: 1
  },
  {
    id:3,
    restauranId:0,
    date:"2023-08-17",
    time: "14:00",
    size: 1,
    userId: 1
  },
  {
    id:4,
    restauranId:0,
    date:"2024-01-25",
    time: "15:00",
    size: 2,
    userId: 7
  },
  {
    id:5,
    restauranId:1,
    date:"2023-07-25",
    time: "11:00",
    size: 2,
    userId: 7
  },
  {
    id:6,
    restauranId:1,
    date:"2022-01-25",
    time: "12:00",
    size: 4,
    userId: 7
  },
]


const reviewsDB = [
  {
    id:0,
    userId:1,
    datetime:"2023-11-14 01:15",
    content: "Lunch specials are worth your while! Delicious cocktails, attentive and speedy wait staff. Plenty of veg options as well.",
    rating: 5,
    restauranId: 0
  },
  {
    id:1,
    userId:7,
    datetime:"2023-11-12 12:15",
    content: "Poor customer service",
    rating: 1,
    restauranId: 1
  },
  {
    id:2,
    userId:9,
    datetime:"2022-11-12 07:15",
    content: "Cannot stand the taste",
    rating: 2,
    restauranId: 2
  },
  {
    id:3,
    userId:9,
    datetime:"2023-11-12 07:15",
    content: "Better service",
    rating: 4,
    restauranId: 0
  },
  {
    id:4,
    userId:1,
    datetime:"2023-09-12 03:15",
    content: "Good service",
    rating: 4,
    restauranId: 0
  },

]


module.exports = { userDB, restaurantsDB, bookingsDB, reviewsDB };
