require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 4000;

// Express is our web server
const app = express();
const server = require("http").createServer(app);

// Allow cross-origin requests so we can send requests from the client (i.e. React)
app.use(cors());

// Parse requests of content-type - application/json
const rawBodyBuffer = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));

// Import routes
const homeRoutes = require("./routes/home/home"),
  apiRoutes = require("./routes/api/api");

// Import React build
app.use(express.static("client/build"));

// Use routes
app.use("*", homeRoutes);
app.post("*", apiRoutes);

// Start the server
server.listen(PORT, function () {
  console.log("listening on port 4000");
});
