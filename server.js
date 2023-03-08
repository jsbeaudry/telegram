require("dotenv").config();
const express = require("express");
const { json } = require("express");
const app = express();
app.use(express.static("public"));
app.use(json());
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  return res.json({ test: "on" });
});

app.listen(PORT, () => console.log(`Server is up and running on ${PORT}`));
