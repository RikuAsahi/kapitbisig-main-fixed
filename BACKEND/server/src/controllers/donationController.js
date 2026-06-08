const donationService = require('../services/donationService');
const axios = require('axios');

async function createDonation(req, res, next) {
	try {
		const { campaignId, amount, paymentMethod, paymentIntentId, clientKey, paymentMethodId, returnUrl } = req.body || {};
		
		const donation = await donationService.createDonation(
			{ campaignId, amount, paymentMethod, paymentIntentId },
			req.session.userId
		);


		const attchRes = await attachPaymentMethod({paymentIntentId, clientKey, paymentMethodId, returnUrl});
		

		return res.status(201).json({ message: 'Donation created.', donation, checkout: attchRes });
	} catch (error) {
		next(error);
	}
}

async function createPaymentIntent(req, res, next) {

	const { amount, description } = req.body || {};

    const paymentIntent = await axios.post(
        'https://api.paymongo.com/v1/payment_intents',
        {
            data: {
                attributes: {
                    amount: amount,
                    currency: 'PHP',
                    payment_method_allowed: ['gcash', 'paymaya', 'dob', 'brankas', 'card'],
                    description: description
                }
            }
        },
        authHeader()
    );

    return res.json({
		Id: paymentIntent.data.data.id, 
		clientKey : paymentIntent.data.data.attributes.client_key, 
		amount: paymentIntent.data.data.attributes.amount,
		description: paymentIntent.data.data.attributes.description
	});
}

async function createPaymentMethod(req, res, next) {

	const { type, name, email  } = req.body || {};
	console.log(type);
	try {
		 const paymentMethod = await axios.post(
			'https://api.paymongo.com/v1/payment_methods',
			{
				data: {
					attributes: {
						type: type,
						billing: {
							name: name,
							email: email,
						}	
					}
				}
			},
			authHeader()
		);

		return res.json(paymentMethod.data.data);
	} catch (error) {
		next(error.response?.data);
	}
   
}

async function attachPaymentMethod(data) {

    const attachRes = await axios.post(
        `https://api.paymongo.com/v1/payment_intents/${data.paymentIntentId}/attach`,
        {
            data: {
                attributes: {
                    payment_method: data.paymentMethodId,
					client_key: data.clientKey,
                    return_url: data.returnUrl
                }
            }
        },
        authHeader()
    );

    return attachRes.data.data;
}

function authHeader() {

	const secretKey = process.env.paymongo_secret_key;
	
    return {
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization:
                'Basic ' + Buffer.from(secretKey + ':').toString('base64')
        }
    };
}

async function verifyPaymentIntentStatus(paymentIntentId){
	const response = await axios.get(
		`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`,
		authHeader()
	);

	return  response.data.data;
}

async function paymentCallback(req, res, next) {
	try {
        const { campaignId, paymentIntentId } = req.body;
		console.log('Payment Callback');
		
        if (!paymentIntentId) {
            return res.status(400).send('Missing query parameters');
        }
		
		const donation = await donationService.getDonationsByTransactionRef(paymentIntentId);
		if (!donation){
			return;
		}
		
        // Verify payment with PayMongo
        const payment = await verifyPaymentIntentStatus(paymentIntentId);
		console.log('Verify payment');

		const tempTransactionRef = paymentIntentId;
		const transactionRef = payment.attributes.payments[0].id;
        const status = payment?.attributes?.status;
		

        // TODO: update database only if succeeded
        if (status === 'succeeded') {
            await donationService.processDonation({
				status: 'completed',
				transactionRef: transactionRef,
				tempTransactionRef: tempTransactionRef
			});
            console.log('Payment successful');

        } else {
			await donationService.processDonation({
				status: 'failed',
				transactionRef: transactionRef,
				tempTransactionRef: tempTransactionRef
			});
            console.log('Payment not successful:', status);

        }

      
        return res.json({status: status});

    } catch (error) {
        console.error('Payment callback error:', error);
        next(error);
    }
}

async function getDonation(req, res, next) {
	try {
		const { id } = req.params;
		const donation = await donationService.getDonationDetail(id, req.session.userId);
		return res.json({ donation });
	} catch (error) {
		next(error);
	}
}

async function getCampaignDonations(req, res, next) {
	try {
		const { campaignId } = req.params;
		const { limit = 100, offset = 0 } = req.query;

		const donations = await donationService.getDonationsByCampaign(
			campaignId,
			Number(limit),
			Number(offset)
		);

		return res.json({ donations, count: donations.length });
	} catch (error) {
		next(error);
	}
}

async function getMyDonations(req, res, next) {
	try {
		const { limit = 50, offset = 0 } = req.query;

		const donations = await donationService.getDonationsByDonor(
			req.session.userId,
			Number(limit),
			Number(offset)
		);

		return res.json({ donations, count: donations.length });
	} catch (error) {
		next(error);
	}
}

async function getCampaignStats(req, res, next) {
	try {
		const { campaignId } = req.params;
		const stats = await donationService.getCampaignDonationStats(campaignId);
		return res.json({ stats });
	} catch (error) {
		next(error);
	}
}

module.exports = {
	createDonation,
	getDonation,
	getCampaignDonations,
	getMyDonations,
	getCampaignStats,
	createPaymentIntent,
    createPaymentMethod,
    attachPaymentMethod,
    authHeader,
	paymentCallback
};
