require("dotenv").config();
const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const [planA, planB, planC] = [
  "price_1Mj4hPI4ImfNjweeB0fXE9xA",
  "price_1Mj4hPI4ImfNjweehhxUwzUh",
  "price_1Mj4hQI4ImfNjweeP0q6iEuK",
];

const stripeSession = async (plan, userId) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      client_reference_id: userId,
      line_items: [
        {
          price: plan,
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/success.html",
      cancel_url: "http://localhost:3000/cancel.html",
    });
    return session;
  } catch (e) {
    return e;
  }
};

const checkoutsession = async (plan, userId) => {
  let planId = null;
  if (plan === 5) planId = planA;
  else if (plan === 10) planId = planB;
  else if (plan === 20) planId = planC;
  try {
    const rep = await stripeSession(planId, userId);

    return { url: rep.url };
  } catch (error) {
    res.send(error);
  }
};

module.exports = { checkoutsession };
