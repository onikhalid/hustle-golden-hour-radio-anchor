/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextOverlayGenerator, type OverlayTemplate, type OverlayStyle } from "@/lib/text-overlay-generator"
import { Palette, Type, Download, Eye } from "lucide-react"

interface TextOverlayDesignerProps {
  onTemplateSelect: (template: OverlayTemplate) => void
  onStyleUpdate: (style: OverlayStyle) => void
}

export function TextOverlayDesigner({ onTemplateSelect, onStyleUpdate }: TextOverlayDesignerProps) {
  const [generator] = useState(() => new TextOverlayGenerator())
  const [templates, setTemplates] = useState<OverlayTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<OverlayTemplate | null>(null)
  const [customStyle, setCustomStyle] = useState<OverlayStyle | null>(null)
  const [previewText, setPreviewText] = useState("Sample Text")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("answer")

  useEffect(() => {
    const allTemplates = generator.getTemplates()
    setTemplates(allTemplates)

    // Select first template by default
    if (allTemplates.length > 0) {
      const firstTemplate = allTemplates[0]
      setSelectedTemplate(firstTemplate)
      setCustomStyle(firstTemplate.style)
      setPreviewText(firstTemplate.defaultText)
    }
  }, [generator])

  useEffect(() => {
    if (customStyle) {
      generatePreview()
      onStyleUpdate(customStyle)
    }
  }, [customStyle, previewText, onStyleUpdate])

  const generatePreview = async () => {
    if (!customStyle) return

    try {
      const blob = await generator.generateOverlay(previewText, customStyle)
      const url = URL.createObjectURL(blob)

      // Clean up previous URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      setPreviewUrl(url)
    } catch (error) {
      console.error("Failed to generate preview:", error)
    }
  }

  const handleTemplateSelect = (template: OverlayTemplate) => {
    setSelectedTemplate(template)
    setCustomStyle({ ...template.style })
    setPreviewText(template.defaultText)
    onTemplateSelect(template)
  }

  const updateStyle = (updates: Partial<OverlayStyle>) => {
    if (!customStyle) return

    const newStyle = { ...customStyle, ...updates }
    setCustomStyle(newStyle)
  }

  const filteredTemplates = templates.filter((template) =>
    activeCategory === "all" ? true : template.category === activeCategory,
  )

  const exportStyle = () => {
    if (!customStyle) return

    const styleJson = generator.exportStyle(customStyle)
    const blob = new Blob([styleJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `overlay-style-${customStyle.name.toLowerCase().replace(/\s+/g, "-")}.json`
    a.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Text Overlay Designer
          </CardTitle>
          <CardDescription>Create and customize professional text overlays for your game show</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="templates" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="customize">Customize</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  variant={activeCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory("all")}
                >
                  All
                </Button>
                <Button
                  variant={activeCategory === "answer" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory("answer")}
                >
                  Answer
                </Button>
                <Button
                  variant={activeCategory === "result" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory("result")}
                >
                  Result
                </Button>
                <Button
                  variant={activeCategory === "question" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory("question")}
                >
                  Question
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {template.category}
                        </Badge>
                      </div>

                      <div
                        className="mt-3 p-3 rounded-lg text-center text-sm"
                        style={{
                          backgroundColor: template.style.backgroundColor,
                          color: template.style.textColor,
                          fontFamily: template.style.fontFamily,
                          fontWeight: template.style.fontWeight,
                        }}
                      >
                        {template.defaultText}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Customize Tab */}
            <TabsContent value="customize" className="space-y-6">
              {customStyle && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Text Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Text Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="preview-text">Preview Text</Label>
                        <Input
                          id="preview-text"
                          value={previewText}
                          onChange={(e) => setPreviewText(e.target.value)}
                          placeholder="Enter text to preview"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="font-family">Font Family</Label>
                        <Select
                          value={customStyle.fontFamily}
                          onValueChange={(value) => updateStyle({ fontFamily: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                            <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                            <SelectItem value="Georgia, serif">Georgia</SelectItem>
                            <SelectItem value="Impact, sans-serif">Impact</SelectItem>
                            <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Font Size: {customStyle.fontSize}px</Label>
                        <Slider
                          value={[customStyle.fontSize]}
                          onValueChange={([value]) => updateStyle({ fontSize: value })}
                          min={24}
                          max={120}
                          step={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="font-weight">Font Weight</Label>
                        <Select
                          value={customStyle.fontWeight}
                          onValueChange={(value) => updateStyle({ fontWeight: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="lighter">Light</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="text-align">Text Alignment</Label>
                        <Select
                          value={customStyle.textAlign}
                          onValueChange={(value: "left" | "center" | "right") => updateStyle({ textAlign: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Style Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Style Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bg-color">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="bg-color"
                            type="color"
                            value={customStyle.backgroundColor}
                            onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={customStyle.backgroundColor}
                            onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                            placeholder="#1f2937"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="text-color">Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="text-color"
                            type="color"
                            value={customStyle.textColor}
                            onChange={(e) => updateStyle({ textColor: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={customStyle.textColor}
                            onChange={(e) => updateStyle({ textColor: e.target.value })}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Padding: {customStyle.padding}px</Label>
                        <Slider
                          value={[customStyle.padding]}
                          onValueChange={([value]) => updateStyle({ padding: value })}
                          min={20}
                          max={120}
                          step={10}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Border Radius: {customStyle.borderRadius}px</Label>
                        <Slider
                          value={[customStyle.borderRadius]}
                          onValueChange={([value]) => updateStyle({ borderRadius: value })}
                          min={0}
                          max={50}
                          step={5}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="shadow"
                          checked={customStyle.shadow}
                          onCheckedChange={(checked) => updateStyle({ shadow: checked })}
                        />
                        <Label htmlFor="shadow">Drop Shadow</Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="animation">Animation</Label>
                        <Select
                          value={customStyle.animation || "none"}
                          onValueChange={(value) => updateStyle({ animation: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="fade">Fade In</SelectItem>
                            <SelectItem value="slide">Slide In</SelectItem>
                            <SelectItem value="zoom">Zoom In</SelectItem>
                            <SelectItem value="pulse">Pulse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Live Preview</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generatePreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportStyle}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Style
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="aspect-video bg-black rounded-lg flex items-center justify-center overflow-hidden">
                    {previewUrl ? (
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Overlay Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-white/50 text-center">
                        <Palette className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Generating preview...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {customStyle && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Style Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Font:</span>
                        <p className="font-medium">
                          {customStyle.fontFamily.split(",")[0]} {customStyle.fontSize}px
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Colors:</span>
                        <div className="flex gap-1 mt-1">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: customStyle.backgroundColor }}
                          />
                          <div className="w-4 h-4 rounded border" style={{ backgroundColor: customStyle.textColor }} />
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Animation:</span>
                        <p className="font-medium capitalize">{customStyle.animation || "None"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Effects:</span>
                        <p className="font-medium">{customStyle.shadow ? "Shadow" : "None"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
