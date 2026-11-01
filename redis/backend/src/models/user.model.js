const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    
    Username:{
           type:String,
           unique:true,
           required:true
    },

    Email:{
        type:String,
        unique:true,
        required:true
    },

    password:{
        type:String,
        required:true
    },
    googleid:{
        type:String,
        unique:true,
        sparse:true
    },
    isverified:{
        type:Boolean,
        default:false
    }
},{timestamps:true})

const userModel = mongoose.model('User',userSchema)

module.exports = userModel