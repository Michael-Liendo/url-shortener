require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns')

let bodyParser = require('body-parser')
let mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }))

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
    res.json({ greeting: 'hello API' });
});

// URL Shortener

const urlSchema = new mongoose.Schema({
    original_url: String,
    short_url: Number
})

let ShortUrl = mongoose.model('ShortUrl', urlSchema)

app.post('/api/shorturl', async (req, res) => {
    let url = req.body.url

    ShortUrl.findOne({ original_url: url },  async (err, data) => {

         if (!/https/i.test(url) || !/http/i.test(url)) {

            res.json({ "error": 'invalid url' })

        } else if(data === null){

             ShortUrl.find({}, async (err, data)=> {

                let newUrl = new ShortUrl({
                    original_url: url,
                    short_url: data.length + 1
                })

                 newUrl.save()


                let urlSave = await ShortUrl.findOne({"original_url": url})

                let json = { "original_url": urlSave.original_url, "short_url": urlSave.short_url }
        
                res.json(json)

            })

        } else {
            let json = { "original_url": data.original_url, "short_url": data.short_url }
            
            res.json(json)
        }

    })

})

app.get('/api/shorturl/:shortUrl', async (req, res) => {

    let url = req.params.shortUrl;

    let data = await ShortUrl.findOne({"short_url": url})

    if(data === null){
            res.json({"error":"No short URL found for the given input"})
        } else {

            res.redirect(data.original_url)
        }
})

app.get('/:shortUrl', async (req, res) => {

    let url = req.params.shortUrl;

    let data = await ShortUrl.findOne({"short_url": url})

    if(data === null){
            res.json({"error":"No short URL found for the given input"})
        } else {

            res.redirect(data.original_url)
        }
})


app.listen(port, function() {
    console.log(`Listening on port ${port}`);
});
