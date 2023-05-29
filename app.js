// AUTO CLEAR TERMINAL
const clearTerminal = () => {
  process.stdout.write('\x1B[2J\x1B[3J\x1B[H');
};
clearTerminal();
//-------------------------------------------

const express = require('express');
const cors = require('cors');
const service = require('./src/app/rest');
const app = express();

app.use(express.json());
app.use(cors());
app.use('/', service);

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(`Back-end API listening on port ${PORT}`)
})
