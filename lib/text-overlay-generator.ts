export interface OverlayStyle {
  id: string
  name: string
  backgroundColor: string
  textColor: string
  fontSize: number
  fontFamily: string
  fontWeight: string
  textAlign: "left" | "center" | "right"
  padding: number
  borderRadius: number
  shadow: boolean
  animation?: "fade" | "slide" | "zoom" | "pulse" | "none"
  gradient?: {
    enabled: boolean
    colors: string[]
    direction: string
  }
  border?: {
    enabled: boolean
    width: number
    color: string
  }
}

export interface OverlayTemplate {
  id: string
  name: string
  description: string
  category: "answer" | "result" | "question" | "custom"
  style: OverlayStyle
  defaultText: string
  preview?: string
}

export class TextOverlayGenerator {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private templates!: OverlayTemplate[]

  constructor() {
    this.canvas = document.createElement("canvas")
    this.canvas.width = 1920
    this.canvas.height = 1080
    this.ctx = this.canvas.getContext("2d")!
    this.initializeTemplates()
  }

  private initializeTemplates() {
    this.templates = [
      {
        id: "answer-classic",
        name: "Classic Answer",
        description: "Clean, professional answer prompt",
        category: "answer",
        defaultText: "What's your answer?",
        style: {
          id: "answer-classic",
          name: "Classic Answer",
          backgroundColor: "#1f2937",
          textColor: "#ffffff",
          fontSize: 72,
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold",
          textAlign: "center",
          padding: 60,
          borderRadius: 0,
          shadow: true,
          animation: "fade",
        },
      },
      {
        id: "answer-modern",
        name: "Modern Answer",
        description: "Sleek gradient design with rounded corners",
        category: "answer",
        defaultText: "Time to Answer!",
        style: {
          id: "answer-modern",
          name: "Modern Answer",
          backgroundColor: "#8b5cf6",
          textColor: "#ffffff",
          fontSize: 84,
          fontFamily: "Helvetica, sans-serif",
          fontWeight: "bold",
          textAlign: "center",
          padding: 80,
          borderRadius: 20,
          shadow: true,
          animation: "slide",
          gradient: {
            enabled: true,
            colors: ["#8b5cf6", "#3b82f6"],
            direction: "45deg",
          },
        },
      },
      {
        id: "result-dramatic",
        name: "Dramatic Reveal",
        description: "High-impact result reveal with animation",
        category: "result",
        defaultText: "@result reveal@",
        style: {
          id: "result-dramatic",
          name: "Dramatic Reveal",
          backgroundColor: "#dc2626",
          textColor: "#ffffff",
          fontSize: 96,
          fontFamily: "Impact, sans-serif",
          fontWeight: "bold",
          textAlign: "center",
          padding: 100,
          borderRadius: 15,
          shadow: true,
          animation: "zoom",
          gradient: {
            enabled: true,
            colors: ["#dc2626", "#f59e0b"],
            direction: "135deg",
          },
          border: {
            enabled: true,
            width: 4,
            color: "#ffffff",
          },
        },
      },
      {
        id: "result-elegant",
        name: "Elegant Reveal",
        description: "Sophisticated result presentation",
        category: "result",
        defaultText: "The Answer Is...",
        style: {
          id: "result-elegant",
          name: "Elegant Reveal",
          backgroundColor: "#374151",
          textColor: "#f3f4f6",
          fontSize: 78,
          fontFamily: "Georgia, serif",
          fontWeight: "normal",
          textAlign: "center",
          padding: 70,
          borderRadius: 25,
          shadow: true,
          animation: "pulse",
          border: {
            enabled: true,
            width: 2,
            color: "#d1d5db",
          },
        },
      },
      {
        id: "question-intro",
        name: "Question Intro",
        description: "Professional question introduction",
        category: "question",
        defaultText: "Question #1",
        style: {
          id: "question-intro",
          name: "Question Intro",
          backgroundColor: "#059669",
          textColor: "#ffffff",
          fontSize: 64,
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold",
          textAlign: "center",
          padding: 50,
          borderRadius: 10,
          shadow: true,
          animation: "fade",
        },
      },
    ]
  }

  getTemplates(category?: string): OverlayTemplate[] {
    if (category) {
      return this.templates.filter((template) => template.category === category)
    }
    return this.templates
  }

  getTemplate(id: string): OverlayTemplate | undefined {
    return this.templates.find((template) => template.id === id)
  }

  async generateOverlay(text: string, style: OverlayStyle): Promise<Blob> {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Set background
    if (style.gradient?.enabled && style.gradient.colors.length >= 2) {
      const gradient = this.createGradient(style.gradient.colors, style.gradient.direction)
      this.ctx.fillStyle = gradient
    } else {
      this.ctx.fillStyle = style.backgroundColor
    }

    // Calculate overlay dimensions
    const overlayWidth = this.canvas.width - style.padding * 2
    const overlayHeight = 200 + style.padding
    const overlayX = style.padding
    const overlayY = (this.canvas.height - overlayHeight) / 2

    // Draw background with border radius
    this.drawRoundedRect(overlayX, overlayY, overlayWidth, overlayHeight, style.borderRadius)
    this.ctx.fill()

    // Draw border if enabled
    if (style.border?.enabled) {
      this.ctx.strokeStyle = style.border.color
      this.ctx.lineWidth = style.border.width
      this.ctx.stroke()
    }

    // Configure text style
    this.ctx.fillStyle = style.textColor
    this.ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
    this.ctx.textAlign = style.textAlign
    this.ctx.textBaseline = "middle"

    // Add shadow if enabled
    if (style.shadow) {
      this.ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
      this.ctx.shadowBlur = 15
      this.ctx.shadowOffsetX = 5
      this.ctx.shadowOffsetY = 5
    }

    // Calculate text position
    let textX: number
    switch (style.textAlign) {
      case "left":
        textX = overlayX + style.padding
        break
      case "right":
        textX = overlayX + overlayWidth - style.padding
        break
      default:
        textX = this.canvas.width / 2
    }

    const textY = this.canvas.height / 2

    // Draw main text with word wrapping
    this.drawWrappedText(text, textX, textY, overlayWidth - style.padding * 2, style.fontSize * 1.2)

    // Reset shadow
    this.ctx.shadowColor = "transparent"
    this.ctx.shadowBlur = 0
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 0

    // Convert to blob
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        resolve(blob!)
      }, "image/png")
    })
  }

  private createGradient(colors: string[], direction: string): CanvasGradient {
    // Parse direction (simplified - supports basic angles)
    const angle = Number.parseInt(direction.replace("deg", "")) || 0
    const radians = (angle * Math.PI) / 180

    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    const radius = Math.max(this.canvas.width, this.canvas.height) / 2

    const x1 = centerX - Math.cos(radians) * radius
    const y1 = centerY - Math.sin(radians) * radius
    const x2 = centerX + Math.cos(radians) * radius
    const y2 = centerY + Math.sin(radians) * radius

    const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2)

    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color)
    })

    return gradient
  }

  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
    this.ctx.closePath()
  }

  private drawWrappedText(text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(" ")
    let line = ""
    let currentY = y

    // Calculate total text height for vertical centering
    const lines = []
    let testLine = ""

    for (const word of words) {
      testLine = line + word + " "
      const metrics = this.ctx.measureText(testLine)
      if (metrics.width > maxWidth && line !== "") {
        lines.push(line.trim())
        line = word + " "
      } else {
        line = testLine
      }
    }
    lines.push(line.trim())

    // Adjust starting Y for vertical centering
    const totalHeight = lines.length * lineHeight
    currentY = y - totalHeight / 2 + lineHeight / 2

    // Draw each line
    for (const textLine of lines) {
      this.ctx.fillText(textLine, x, currentY)
      currentY += lineHeight
    }
  }

  async generatePreview(template: OverlayTemplate, customText?: string): Promise<string> {
    const text = customText || template.defaultText
    const blob = await this.generateOverlay(text, template.style)
    return URL.createObjectURL(blob)
  }

  exportStyle(style: OverlayStyle): string {
    return JSON.stringify(style, null, 2)
  }

  importStyle(styleJson: string): OverlayStyle {
    return JSON.parse(styleJson)
  }

  createCustomTemplate(
    name: string,
    style: OverlayStyle,
    text: string,
    category: "answer" | "result" | "question" | "custom",
  ): OverlayTemplate {
    return {
      id: `custom-${Date.now()}`,
      name,
      description: "Custom overlay template",
      category,
      style,
      defaultText: text,
    }
  }
}
