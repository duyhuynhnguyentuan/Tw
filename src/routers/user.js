const express = require('express');
const User = require('../models/user')
//original router
const router = new express.Router();

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

module.exports = router