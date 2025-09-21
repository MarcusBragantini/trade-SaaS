const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { validateSubscription } = require('../middleware/validation');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const router = express.Router();

// Rota pública de teste
// Rota simples para teste
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Subscription API working'
  });
});

// Get subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Plano Gratuito',
        price: 0,
        features: [
          'Acesso básico ao dashboard',
          'Análise de mercado limitada',
          'Suporte por email',
          '1 estratégia de trading'
        ],
        limitations: {
          dailyTrades: 5,
          aiAnalysis: false,
          autoTrading: false
        }
      },
      {
        id: 'basic',
        name: 'Plano Básico',
        price: 29.90,
        interval: 'monthly',
        features: [
          'Acesso completo ao dashboard',
          'Análise de mercado completa',
          'Suporte prioritário',
          '5 estratégias de trading',
          'Trading semiautomático'
        ],
        limitations: {
          dailyTrades: 20,
          aiAnalysis: true,
          autoTrading: false
        }
      },
      {
        id: 'pro',
        name: 'Plano Pro',
        price: 79.90,
        interval: 'monthly',
        features: [
          'Todos os recursos do Plano Básico',
          'Trading automatizado',
          'Alertas em tempo real',
          'Estratégias ilimitadas',
          'Suporte 24/7'
        ],
        limitations: {
          dailyTrades: 100,
          aiAnalysis: true,
          autoTrading: true
        }
      },
      {
        id: 'enterprise',
        name: 'Plano Enterprise',
        price: 199.90,
        interval: 'monthly',
        features: [
          'Todos os recursos do Plano Pro',
          'Contas múltiplas',
          'API acesso completo',
          'Relatórios personalizados',
          'Gerente de conta dedicado'
        ],
        limitations: {
          dailyTrades: 500,
          aiAnalysis: true,
          autoTrading: true
        }
      }
    ];

    res.json({
      status: 'success',
      data: { plans }
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
});

// Create checkout session
router.post('/create-checkout-session', validateSubscription, async (req, res) => {
  try {
    const { planId, interval = 'monthly' } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    const plans = {
      'basic-monthly': {
        price: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || 'price_basic_monthly',
        amount: 2990
      },
      'basic-yearly': {
        price: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || 'price_basic_yearly',
        amount: 29900
      },
      'pro-monthly': {
        price: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
        amount: 7990
      },
      'pro-yearly': {
        price: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
        amount: 79900
      },
      'enterprise-monthly': {
        price: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
        amount: 19990
      },
      'enterprise-yearly': {
        price: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly',
        amount: 199900
      }
    };

    const planKey = `${planId}-${interval}`;
    const selectedPlan = plans[planKey];

    if (!selectedPlan) {
      return res.status(400).json({
        status: 'error',
        message: 'Plano inválido'
      });
    }

    // Create Stripe customer if not exists
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id.toString()
        }
      });
      customerId = customer.id;
      
      // Save customer ID to user
      await User.update(user.id, {
        stripe_customer_id: customerId
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.price,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/cancel`,
      metadata: {
        userId: user.id.toString(),
        planId,
        interval
      }
    });

    res.json({
      status: 'success',
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
});

// Handle Stripe webhook
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Webhook handlers
async function handleCheckoutSessionCompleted(session) {
  const { userId, planId, interval } = session.metadata;
  
  const user = await User.findById(userId);
  if (!user) {
    console.error('User not found for webhook:', userId);
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  // Calculate period end
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + (interval === 'yearly' ? 365 : 30));

  // Update user subscription
  await Subscription.updateUserSubscription(userId, {
    plan: planId,
    status: 'active',
    currentPeriodEnd: periodEnd,
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription
  });

  // Create subscription record
  await Subscription.create({
    userId,
    planId,
    interval,
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: periodEnd,
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
    amount: subscription.items.data[0].price.unit_amount / 100
  });

  console.log(`Subscription activated for user: ${userId}`);
}

async function handleSubscriptionUpdated(subscription) {
  // Handle subscription updates
  console.log('Subscription updated:', subscription.id);
}

async function handleSubscriptionDeleted(subscription) {
  // Handle subscription cancellation
  const sub = await Subscription.findByStripeSubscriptionId(subscription.id);
  if (sub) {
    await Subscription.updateUserSubscription(sub.user_id, {
      status: 'canceled',
      currentPeriodEnd: null
    });
    console.log(`Subscription canceled for user: ${sub.user_id}`);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  // Handle successful payment
  console.log('Payment succeeded for invoice:', invoice.id);
}

async function handleInvoicePaymentFailed(invoice) {
  // Handle failed payment
  console.log('Payment failed for invoice:', invoice.id);
}

// Get current user subscription
router.get('/current', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    let subscriptionDetails = null;
    
    if (user.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          user.stripe_subscription_id
        );
        
        subscriptionDetails = {
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
        };
      } catch (error) {
        console.error('Error retrieving Stripe subscription:', error);
      }
    }

    res.json({
      status: 'success',
      data: {
        subscription: {
          plan: user.subscription_plan,
          status: user.subscription_status,
          currentPeriodEnd: user.current_period_end,
          stripeCustomerId: user.stripe_customer_id,
          stripeSubscriptionId: user.stripe_subscription_id
        },
        details: subscriptionDetails,
        canTrade: user.canTrade()
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    if (!user.stripe_subscription_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Nenhuma assinatura ativa encontrada'
      });
    }

    // Cancel at period end
    const subscription = await stripe.subscriptions.update(
      user.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    await User.update(user.id, {
      subscription_status: 'canceled'
    });

    res.json({
      status: 'success',
      message: 'Assinatura cancelada com sucesso. Ela permanecerá ativa até o final do período atual.',
      data: {
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;