const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { requireAuth } = require('./auth');

// Initialize Stripe (will use test key if real key not provided)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Create payment intent for a rental
router.post('/create-intent', requireAuth, async (req, res) => {
  try {
    const { rentalId } = req.body;

    const rental = db.prepare(`
      SELECT r.*, u.email, u.stripe_customer_id
      FROM rentals r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ? AND r.user_id = ?
    `).get(rentalId, req.session.userId);

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    if (rental.payment_status === 'paid') {
      return res.status(400).json({ error: 'Rental already paid' });
    }

    // Create or get Stripe customer
    let customerId = rental.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: rental.email,
        metadata: { userId: req.session.userId }
      });
      customerId = customer.id;
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?')
        .run(customerId, req.session.userId);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(rental.total_amount * 100), // Convert to cents
      currency: 'cad',
      customer: customerId,
      metadata: {
        rentalId: rental.id,
        userId: req.session.userId
      }
    });

    // Save payment intent ID
    db.prepare('UPDATE rentals SET stripe_payment_intent_id = ? WHERE id = ?')
      .run(paymentIntent.id, rentalId);

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: rental.total_amount
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Confirm payment success
router.post('/confirm', requireAuth, async (req, res) => {
  try {
    const { rentalId, paymentIntentId } = req.body;

    const rental = db.prepare('SELECT * FROM rentals WHERE id = ? AND user_id = ?')
      .get(rentalId, req.session.userId);

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      db.prepare(`
        UPDATE rentals SET payment_status = 'paid', status = 'confirmed' WHERE id = ?
      `).run(rentalId);

      res.json({ success: true, message: 'Payment confirmed!' });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Stripe webhook for async payment events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const rentalId = paymentIntent.metadata.rentalId;

      if (rentalId) {
        db.prepare(`
          UPDATE rentals SET payment_status = 'paid', status = 'confirmed' WHERE id = ?
        `).run(rentalId);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      const failedRentalId = failedPayment.metadata.rentalId;

      if (failedRentalId) {
        db.prepare(`
          UPDATE rentals SET payment_status = 'failed' WHERE id = ?
        `).run(failedRentalId);
      }
      break;
  }

  res.json({ received: true });
});

// Get publishable key
router.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
  });
});

module.exports = router;
