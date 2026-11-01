const mongoose = require('mongoose')


async function connectdb() {
    mongoose.connect(process.env.MONGO_URI)
    console.log("Mongodb connected");
    
}

module.exports = connectdb