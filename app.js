const express = require('express');
const cors = require('cors');
const service = require('./src/app/rest');
const app = express();

app.use(express.json());
app.use(cors());
app.use('/', service);

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
