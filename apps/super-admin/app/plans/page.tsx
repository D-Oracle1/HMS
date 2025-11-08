"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "ui";
import { Check, Star, Zap, Crown } from "lucide-react";

export default function PlansPage() {
  const plans = [
    {
      id: "starter",
      name: "Starter",
      icon: Star,
      price: 49,
      description: "Perfect for small hotels",
      features: [
        "Up to 20 rooms",
        "Basic reporting",
        "Email support",
        "1 hotel location",
        "Standard customization",
      ],
      subscribers: 12,
    },
    {
      id: "professional",
      name: "Professional",
      icon: Zap,
      price: 99,
      description: "For growing hotel chains",
      features: [
        "Up to 100 rooms",
        "Advanced analytics",
        "Priority support",
        "Up to 5 hotel locations",
        "Full theme customization",
        "API access",
      ],
      subscribers: 8,
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      icon: Crown,
      price: 299,
      description: "For large hotel groups",
      features: [
        "Unlimited rooms",
        "Custom reports & dashboards",
        "24/7 phone support",
        "Unlimited locations",
        "White-label solution",
        "Dedicated account manager",
        "Custom integrations",
      ],
      subscribers: 4,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Subscription Plans</h1>
          <p className="text-muted-foreground text-lg">
            Manage pricing and features for your hotel management platform
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? "border-primary shadow-lg" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-8">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <plan.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Features included:
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-center text-muted-foreground mb-3">
                    {plan.subscribers} active subscribers
                  </p>
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full"
                  >
                    Manage Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Revenue</CardTitle>
            <CardDescription>
              Monthly recurring revenue breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.subscribers} subscribers
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      ${plan.price * plan.subscribers}
                    </p>
                    <p className="text-sm text-muted-foreground">per month</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-4 bg-primary/5 border-2 border-primary rounded-lg">
                <p className="font-semibold text-lg">Total MRR</p>
                <p className="text-3xl font-bold text-primary">
                  $
                  {plans.reduce(
                    (sum, plan) => sum + plan.price * plan.subscribers,
                    0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
