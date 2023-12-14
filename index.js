// Requiring module
require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");
const app = express();

const userRoutes = require("./api/routes/user");
const notesRoutes = require("./api/routes/notes");

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connecting to database
mongoose.connect(process.env.CONNECTION_STRING);

app.use("/user", userRoutes);
app.use("/notes", notesRoutes);

app.get("/", function (req, res) {
  try {
    res.send("<h1>Backend Working</h1>");
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong");
  }
});

app.listen(process.env.PORT, function () {
  console.log(`Server started on port ${process.env.PORT}`);
});
