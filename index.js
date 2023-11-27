// Requiring module
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connecting to database
mongoose.connect(process.env.CONNECTION_STRING);

// Creating Schemas
const noteSchema = new mongoose.Schema({
  title: String,
  content: String,
});

// Creating models from userSchema and postSchema
const Note = mongoose.model("Note", noteSchema);

const note1 = new Note({
  title: "Boost Productivity",
  content:
    "Maximize efficiency with task prioritization, time-blocking, and strategic breaks. Stay focused and stress-free throughout your workday.",
});

app.get("/", async function (req, res) {
  try {
    const foundItems = await Note.find({}).exec();

    if (foundItems.length === 0) {
      // Save new note
      await note1.save();
      res.redirect("/notes");
    } else {
      res.send("<h1>Backend Working</h1>");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong");
  }
});
app.get("/notes", async function (req, res) {
  try {
    const foundItems = await Note.find({}).exec();
    if (foundItems.length === 0) {
      res.redirect("/");
    } else {
      res.send(foundItems);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/notes", async function (req, res) {
  const note = new Note({
    title: req.body.title,
    content: req.body.content,
  });
  await note.save();
  res.status(201).json({ meassage: "Note created successfully!" });
});
app.post("/delete/:id", async (req, res) => {
  // Find note and delete it
  Note.deleteOne({ _id: req.params.id })
    .then(() => res.status(200).send())
    .catch((error) => {
      console.error("erro at hear" + error);
      res.status(500).send("Server error");
    });
});
app.put("/update/:id", async function (req, res) {
  const { id } = req.params;

  try {
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      {
        title: req.body.title,
        content: req.body.content,
      },
      { new: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json({ message: "Note updated successfully", updatedNote });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.listen(process.env.PORT, function () {
  console.log(`Server started on port ${process.env.PORT}`);
});
