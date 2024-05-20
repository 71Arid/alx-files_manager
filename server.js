const express = require('express');

const PORT = process.env.PORT || 5000;
const app = express();

const routes = require('./routes/index');

app.use('/', routes);
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
