const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("OK FUNCIONANDO");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log("RUNNING ON PORT:", PORT);
});