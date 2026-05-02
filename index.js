const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("API OK");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("RUNNING ON PORT:", PORT);
});