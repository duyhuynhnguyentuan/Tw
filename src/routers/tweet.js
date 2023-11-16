const express = require('express');
const Tweet = require('../models/Tweet');
//new router
const router = new express.Router();
const auth = require('../middleware/auth')
//multer and sharp for image loading
const multer = require('multer');
const sharp = require('sharp');
const { updateOne } = require('../models/user');
const upload = multer({
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB in bytes
    }
});
//Post tweet router
router.post('/tweets',auth, async (req, res) => {
    const tweet = new Tweet({
        ...req.body,
        user: req.user._id
    })
    try {
        await tweet.save()
        res.status(201).send(tweet)
    } catch (error) {
        res.status(500).send(error)
    }
})
//get all tweet route
router.get('/tweets', async(req, res) => {
    try {
        const tweet = await Tweet.find({})
        res.send(tweet)

    } catch (error) {
        res.status(500).send(error)
    }
})
//get a user's tweets
router.get('/tweets/:id', async(req, res) => {
    try {
        const _id = req.params.id
        const tweet = await Tweet.find({user : _id})
        if(!tweet){
            return res.status(404).send()
        }
        res.send(tweet)

    } catch (error) {
        res.status(500).send(error)
    }
})
//upload image tweet
router.post('/uploadTweetImage/:id', auth, upload.single('upload'), async (req, res) => {
    const tweet = await Tweet.findOne({ _id: req.params.id })
    console.log(tweet)
    if (!tweet) {
        throw new Error('Cannot find the tweet')
    }
    const buffer = await sharp(req.file.buffer).resize({ width: 350, height: 350 }).png().toBuffer()
    console.log(buffer)
    tweet.image = buffer
    await tweet.save()
    res.send(buffer)
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})
//get tweet image
router.get('/tweets/:id/image', async(req, res) => {
 try {
    const tweet = await Tweet.findById(req.params.id)
    if (!tweet && !tweet.image){
        throw new Error('Cannot find the tweet')
    }
    res.set('Content-Type', 'image/jpg')
    res.send(tweet.image)
 } catch (error) {
    res.status(404).send({ error: error.message })
 }
})
//Like tweet
router.put('/tweets/:id/like', auth, async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id);
        if (!tweet.likes.includes(req.user._id)) {
        await tweet.updateOne({ $push: { likes: req.user._id } });
        // await req.user.updateOne({ $push: { followings: req.params.id } });
        res.status(200).json("post has been liked");
        console.log('it has been liked');
        } else {
            res.status(403).json("you have already liked this post");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

//Unlike tweet
router.put('/tweets/:id/unlike', auth, async (req, res)=> {
    try {
        const tweet = await Tweet.findById(req.params.id);
        if(tweet.likes.includes(req.user._id)){
            await tweet.updateOne({$pull: {likes : req.user._id}});
            res.status(200).json("Unlike tweet successfully")
        }else{
            res.status(403).json("Have not liked tweet")
        }
    } catch (error) {
        res.status(500).json(error)
    }
})

module.exports = router