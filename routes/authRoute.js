const { Router } = require('express')
const authController = require('../controllers/authController')
const weatherController=require('../controllers/weatheController')
const router = Router();

router.post('/signup', authController.signup_post)
router.post('/login', authController.login_post)
router.post('/logout', authController.logout_get)
router.get('/profile', authController.profile_get);

router.get('/current-weather',weatherController.current_weather_get)
router.post('/updateMyPlocation',weatherController.UpdatePLocatoin_post)

module.exports = router;