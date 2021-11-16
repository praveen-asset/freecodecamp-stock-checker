const mongoose = require("mongoose")
const db = mongoose.connect(process.env.DB, {
    useUnifiedTopology: true, 
    useNewURlParser: true
})
module.exports = db