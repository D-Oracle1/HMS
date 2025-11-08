"use client";

import { useState, useEffect } from "react";
import { useThemeStore } from "../../store/themeStore";
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui";
import { Palette, Save, RotateCcw, Upload } from "lucide-react";

export default function ThemeEditorPage() {
  const { theme, setTheme, resetTheme, saveTheme } = useThemeStore();
  const [tenantId, setTenantId] = useState("demo-tenant-id");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveTheme(tenantId);
      alert("Theme saved successfully!");
    } catch (error) {
      alert("Failed to save theme. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const fontOptions = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
  ];

  const borderRadiusOptions = [
    { label: "None", value: "0" },
    { label: "Small", value: "0.25rem" },
    { label: "Medium", value: "0.5rem" },
    { label: "Large", value: "1rem" },
    { label: "Extra Large", value: "1.5rem" },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-2">
              <Palette className="h-10 w-10" />
              Theme Editor
            </h1>
            <p className="text-muted-foreground mt-2">
              Customize your hotel brand without writing code
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetTheme}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Theme"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="space-y-6">
            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Colors</CardTitle>
                <CardDescription>
                  Choose your brand colors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) =>
                        setTheme({ primaryColor: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={theme.primaryColor}
                      onChange={(e) =>
                        setTheme({ primaryColor: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={theme.secondaryColor}
                      onChange={(e) =>
                        setTheme({ secondaryColor: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={theme.secondaryColor}
                      onChange={(e) =>
                        setTheme({ secondaryColor: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) =>
                        setTheme({ accentColor: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={theme.accentColor}
                      onChange={(e) =>
                        setTheme({ accentColor: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Typography */}
            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Select your font family</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <select
                    id="fontFamily"
                    value={theme.fontFamily}
                    onChange={(e) => setTheme({ fontFamily: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {fontOptions.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Border Radius */}
            <Card>
              <CardHeader>
                <CardTitle>Border Radius</CardTitle>
                <CardDescription>Adjust corner roundness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Border Radius</Label>
                  <select
                    id="borderRadius"
                    value={theme.borderRadius}
                    onChange={(e) =>
                      setTheme({ borderRadius: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {borderRadiusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Logo</CardTitle>
                <CardDescription>Upload your hotel logo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logo"
                      type="text"
                      placeholder="/logo.png"
                      value={theme.logoUrl || ""}
                      onChange={(e) => setTheme({ logoUrl: e.target.value })}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  See how your theme looks in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border rounded-lg p-8 space-y-4"
                  style={{
                    backgroundColor: theme.secondaryColor,
                    color: theme.primaryColor,
                    fontFamily: theme.fontFamily,
                  }}
                >
                  {/* Mock Logo */}
                  {theme.logoUrl && (
                    <div className="mb-4">
                      <div
                        className="h-12 bg-gray-200 rounded flex items-center justify-center"
                        style={{ borderRadius: theme.borderRadius }}
                      >
                        <span className="text-sm text-gray-500">Logo Here</span>
                      </div>
                    </div>
                  )}

                  {/* Mock Header */}
                  <h2
                    className="text-3xl font-bold"
                    style={{ color: theme.primaryColor }}
                  >
                    Welcome to Our Hotel
                  </h2>
                  <p className="text-muted-foreground">
                    Experience luxury and comfort at its finest
                  </p>

                  {/* Mock Button */}
                  <button
                    className="px-4 py-2 rounded font-medium"
                    style={{
                      backgroundColor: theme.accentColor,
                      color: "#ffffff",
                      borderRadius: theme.borderRadius,
                    }}
                  >
                    Book Now
                  </button>

                  {/* Mock Card */}
                  <div
                    className="border p-4 mt-4"
                    style={{
                      borderRadius: theme.borderRadius,
                      borderColor: theme.primaryColor + "20",
                    }}
                  >
                    <h3
                      className="font-semibold mb-2"
                      style={{ color: theme.primaryColor }}
                    >
                      Deluxe Suite
                    </h3>
                    <p className="text-sm mb-3">
                      Spacious room with ocean view and premium amenities
                    </p>
                    <div className="flex justify-between items-center">
                      <span
                        className="text-2xl font-bold"
                        style={{ color: theme.accentColor }}
                      >
                        $250/night
                      </span>
                      <button
                        className="px-3 py-1 text-sm rounded"
                        style={{
                          backgroundColor: theme.primaryColor,
                          color: theme.secondaryColor,
                          borderRadius: theme.borderRadius,
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Color Palette Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Color Palette</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div
                      className="h-20 rounded"
                      style={{
                        backgroundColor: theme.primaryColor,
                        borderRadius: theme.borderRadius,
                      }}
                    />
                    <p className="text-xs text-center font-mono">
                      {theme.primaryColor}
                    </p>
                    <p className="text-xs text-center text-muted-foreground">
                      Primary
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="h-20 rounded border"
                      style={{
                        backgroundColor: theme.secondaryColor,
                        borderRadius: theme.borderRadius,
                      }}
                    />
                    <p className="text-xs text-center font-mono">
                      {theme.secondaryColor}
                    </p>
                    <p className="text-xs text-center text-muted-foreground">
                      Secondary
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="h-20 rounded"
                      style={{
                        backgroundColor: theme.accentColor,
                        borderRadius: theme.borderRadius,
                      }}
                    />
                    <p className="text-xs text-center font-mono">
                      {theme.accentColor}
                    </p>
                    <p className="text-xs text-center text-muted-foreground">
                      Accent
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
