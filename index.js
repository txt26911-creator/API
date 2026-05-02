const express = require("express");
const app = express();

app.get("/", (req, res) => {
  console.log("PING RECIBIDO");
  res.send("OK FUNCIONA");
});

app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log("SERVER ON PORT", process.env.PORT);
});