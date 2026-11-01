require('dotenv').config();
const passport = require('passport');
const app = require('./src/app');
const connectdb = require('./src/db/db');

// Uncomment and ensure your passport strategy is configured here if using Google OAuth:
require('./src/db/passport')

app.use(passport.initialize());

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start the server
connectdb();

app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});