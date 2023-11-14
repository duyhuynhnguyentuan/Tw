const express = require('express');
const Tweet = require('../models/Tweet');
//new router
const router = new express.Router();
const auth = require('../middleware/auth')
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

module.exports = router