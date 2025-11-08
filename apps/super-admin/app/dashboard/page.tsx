"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui";
import { Building2, DollarSign, Users, TrendingUp, Globe } from "lucide-react";

export default function SuperAdminDashboardPage() {
  const platformStats = [
    {
      title: "Total Hotels",
      value: "24",
      change: "+3 this month",
      icon: Building2,
    },
    {
      title: "Platform Revenue",
      value: "$145,231",
      change: "+20.1% from last month",
      icon: DollarSign,
    },
    {
      title: "Total Users",
      value: "1,542",
      change: "+180 this month",
      icon: Users,
    },
    {
      title: "Active Tenants",
      value: "18",
      change: "75% occupancy",
      icon: Globe,
    },
  ];

  const recentTenants = [
    {
      id: "1",
      name: "Luxury Hotels Inc",
      subdomain: "luxury",
      hotels: 3,
      status: "active",
      revenue: "$12,500",
    },
    {
      id: "2",
      name: "Budget Stay Group",
      subdomain: "budget",
      hotels: 5,
      status: "active",
      revenue: "$8,750",
    },
    {
      id: "3",
      name: "Boutique Resorts",
      subdomain: "boutique",
      hotels: 2,
      status: "pending",
      revenue: "$0",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Platform Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your entire hotel management platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {platformStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Tenants */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tenants</CardTitle>
            <CardDescription>
              Latest hotel groups on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tenant.subdomain}.yourdomain.com • {tenant.hotels}{" "}
                        hotels
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{tenant.revenue}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        tenant.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {tenant.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
