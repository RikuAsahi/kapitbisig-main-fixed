const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const donationController = require('../controllers/donationController');

const router = express.Router();

router.post('/', auth, donationController.createDonation);
router.get('/my-donations', auth, donationController.getMyDonations);
router.get('/:id', auth, donationController.getDonation);
router.get('/campaign/:campaignId/donations', donationController.getCampaignDonations);
router.get('/campaign/:campaignId/stats', donationController.getCampaignStats);
router.post('/createPaymentIntent', donationController.createPaymentIntent);
router.post('/createPaymentMethod', donationController.createPaymentMethod);
router.get('/payment/callback', async (req, res) => {return  res.json('test');});
router.post('/attachPaymentMethod', async (req, res) => {
    const secretKey = process.env.paymongo_secret_key;
    let paymentIntentId = 'pi_Pptmnbrjk65ZXpi4hoXSnPYY'
    const response = await axios.get(
    `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`,
    {
        headers: {
        accept: 'application/json',
        authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
        }
    }
    );

    return  res.json(response.data.data);
});
// router.get('/verifyPaymentIntentStatus', async (req, res) => {
    
// });
router.post('/checkout', async (req, res) => {
    // Payment Intent ID
    try {
        // 1. Create Payment Intent
        const intentRes = await axios.post(
            'https://api.paymongo.com/v1/payment_intents',
            {
                data: {
                    attributes: {
                        amount: 2000,
                        payment_method_allowed: ['gcash'],
                        currency: 'PHP',
                        description: 'Description',
                        statement_descriptor: 'Test statement'
                    }
                }
            },
            {
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    authorization: 'Basic ' + Buffer.from(secretKey + ':').toString('base64')
                }
            }
        );

        const paymentIntent = intentRes.data.data;

        // 2. Create Payment Method
        const methodRes = await axios.post(
            'https://api.paymongo.com/v1/payment_methods',
            {
                data: {
                    attributes: {
                        type: 'gcash',
                        billing: {
                            name: 'nhadley halcon',
                            email: 'halcon.nhad@gmail.com',
                            phone: '09823847'
                        }
                    }
                }
            },
            {
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    authorization: 'Basic ' + Buffer.from(secretKey + ':').toString('base64')
                }
            }
        );

        const paymentMethod = methodRes.data.data;

        // 3. ATTACH Payment Method to Intent (IMPORTANT)
        const attachRes = await axios.post(
            `https://api.paymongo.com/v1/payment_intents/${paymentIntent.id}/attach`,
            {
                data: {
                    attributes: {
                        payment_method: paymentMethod.id,
                         client_key: paymentIntent.attributes.client_key,
                         return_url: 'http://localhost:4012/Campaign.html?id=15'
                    }
                }
            },
            {
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    authorization: 'Basic ' + Buffer.from(secretKey + ':').toString('base64')
                }
            }
        );

        return res.json(attachRes.data);

    } catch (err) {
        return res.json({ error: err.response?.data || err.message });
    }



    //  return res.json({ paymentIntent: paymentIntentData, paymentMethod: paymentMethodData });
});


module.exports = router;
