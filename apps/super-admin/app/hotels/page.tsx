"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "ui";
import { Building2, Plus, Edit, Trash2, Globe, ToggleLeft, ToggleRight } from "lucide-react";

export default function HotelsManagementPage() {
  const [tenants, setTenants] = useState([
    {
      id: "1",
      name: "Luxury Hotels Inc",
      subdomain: "luxury",
      logoUrl: "/logos/luxury.png",
      hotels: 3,
      isActive: true,
      createdAt: "2025-10-01",
    },
    {
      id: "2",
      name: "Budget Stay Group",
      subdomain: "budget",
      logoUrl: "/logos/budget.png",
      hotels: 5,
      isActive: true,
      createdAt: "2025-10-15",
    },
    {
      id: "3",
      name: "Boutique Resorts",
      subdomain: "boutique",
      logoUrl: "/logos/boutique.png",
      hotels: 2,
      isActive: false,
      createdAt: "2025-11-01",
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Hotels Management</h1>
            <p className="text-muted-foreground">
              Manage all hotels and tenants on the platform
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </div>

        {/* Add Tenant Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Tenant</CardTitle>
              <CardDescription>
                Create a new hotel group on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tenant Name</Label>
                    <Input id="name" placeholder="Luxury Hotels Inc" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <div className="flex gap-2">
                      <Input id="subdomain" placeholder="luxury" />
                      <span className="flex items-center text-sm text-muted-foreground">
                        .yourdomain.com
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input id="logo" placeholder="/logos/tenant.png" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Tenant</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tenants List */}
        <div className="space-y-4">
          {tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">
                        {tenant.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          <span>{tenant.subdomain}.yourdomain.com</span>
                        </div>
                        <span>•</span>
                        <span>{tenant.hotels} hotels</span>
                        <span>•</span>
                        <span>Created {tenant.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Toggle active status
                        setTenants(
                          tenants.map((t) =>
                            t.id === tenant.id
                              ? { ...t, isActive: !t.isActive }
                              : t
                          )
                        );
                      }}
                    >
                      {tenant.isActive ? (
                        <>
                          <ToggleRight className="h-4 w-4 mr-1 text-green-600" />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4 mr-1 text-red-600" />
                          Inactive
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
