const mongoose = require('mongoose');

const url = `mongodb+srv://vaibhav7895:12345@cluster0.dpjtu57.mongodb.net/`;

mongoose.connect(url, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(() => console.log('Connected to DB')).catch((e)=> console.log('Error', e))
