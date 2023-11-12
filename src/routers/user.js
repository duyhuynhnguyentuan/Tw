const express = require('express');
const User = require('../models/user')
//original router
const router = new express.Router();
const multer = require('multer');
const sharp = require('sharp');
const auth = require('../middleware/auth');
//Helpers
const upload = multer({
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB in bytes
    }
});


//Endpoints

//create new user
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try{
        await user.save()
        res.status(201).send(user)
    }catch(e){
        res.status(400).send(e)
    }
})

// Fetch the users
router.get('/users', async(req, res) => {
    try {
        const user = await User.find({})
        res.send(user)
    } catch (e) {
        res.status(500).send(e)
    }
})

//login user router
router.post('/users/login', async (req, res)=> {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch (e) {
        res.status(500).send(e)
    }
})

//delete user route
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id)
        if (!user) {
            return res.status(404).send({message: 'User not found'})
        }
        res.status(200).send({message: 'User deleted'});
    } catch (error) {
        res.status(500).send(error)
    }
})

//Fetch a single user 
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user){
            res.status(404).send({message: 'User not found'})
        }
        res.send(user)
    } catch (error) {
        res.status(500).send(error)
    }
})

//post user profile image
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res)=> {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    if(req.user.avatar != null){
        req.user.avatar = null
        req.user.avatarExists =false
    }
    req.user.avatar = buffer
    req.user.avatarExists = true
    await req.user.save()
    res.send(buffer)
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})
// get the user binary profile image
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar){
            throw new Error('The user does not exist')
        }
        res.set('Content-Type', 'image/jpg')
        res.send(user.avatar)
    } catch (error) {
        res.status(404).send(e)
    }
})

//Route for following
router.put('/users/:id/follow', auth, async (req, res) => {
    if (req.user._id != req.params.id) {
        try {
            const userToFollow = await User.findById(req.params.id);

            if (!userToFollow.followers.includes(req.user._id)) {
                // Update the user being followed
                await userToFollow.updateOne({ $push: { followers: req.user._id } });

                // Update the authenticated user's followings
                await req.user.updateOne({ $push: { following: req.params.id } });

                res.status(200).json("User has been followed successfully");
            } else {
                res.status(403).json("You have already followed this user");
            }
        } catch (error) {
            res.status(500).send(error);
        }
    } else {
        res.status(403).json("You cannot follow yourself");
    }
});

module.exports = router