import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, LineRuleType, BorderStyle } from "docx"
import type { OutputSettings } from "@/components/youtube/output-customization"

// Function to convert markdown to DOCX elements
function markdownToDocxElements(markdown: string, lineSpacing: number): any[] {
  const elements: any[] = []

  // Split markdown into paragraphs
  const paragraphs = markdown.split("\n\n")

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim()
    if (paragraph === "") continue

    // Split paragraph into lines
    const lines = paragraph.split("\n")

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j].trim()
      if (line === "") continue

      // Handle headers
      if (line.startsWith("# ")) {
        elements.push(
          new Paragraph({
            text: line.substring(2),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120, line: Math.round(lineSpacing * 240), lineRule: LineRuleType.EXACT },
          }),
        )
      } else if (line.startsWith("## ")) {
        elements.push(
          new Paragraph({
            text: line.substring(3),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120, line: Math.round(lineSpacing * 240), lineRule: LineRuleType.EXACT },
          }),
        )
      } else if (line.startsWith("### ")) {
        elements.push(
          new Paragraph({
            text: line.substring(4),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 240, after: 120, line: Math.round(lineSpacing * 240), lineRule: LineRuleType.EXACT },
          }),
        )
      }
      // Handle bullet points
      else if (line.match(/^\s*[-*+•]\s+/)) {
        elements.push(
          new Paragraph({
            text: line.replace(/^\s*[-*+•]\s+/, ""),
            bullet: { level: 0 },
            spacing: { before: 60, after: 60, line: Math.round(lineSpacing * 240), lineRule: LineRuleType.EXACT },
          }),
        )
      }
      // Handle horizontal rule
      else if (line.match(/^---+$/)) {
        elements.push(
          new Paragraph({
            border: {
              bottom: {
                color: "auto",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            spacing: { before: 120, after: 120, line: Math.round(lineSpacing * 240), lineRule: LineRuleType.EXACT },
          }),
        )
      }
      // Handle regular paragraphs
      else {
        // Process bold and italic formatting
        const textRuns = processTextFormatting(line)

        elements.push(
          new Paragraph({
            children: textRuns,
            spacing: { before: 120, after: 120, line: Math.round(lineSpacing * 240), lineRule: LineRuleType.EXACT },
          }),
        )
      }
    }
  }

  return elements
}

// Helper function to process text formatting (bold, italic)
function processTextFormatting(text: string): TextRun[] {
  const runs: TextRun[] = []

  // Simple implementation - in a real app, you'd use a more robust parser
  let currentText = ""
  let isBold = false
  let isItalic = false

  for (let i = 0; i < text.length; i++) {
    if (text[i] === "*") {
      // Check for bold (**) or italic (*)
      if (i + 1 < text.length && text[i + 1] === "*") {
        // Add current text run
        if (currentText) {
          runs.push(new TextRun({ text: currentText, bold: isBold, italics: isItalic }))
          currentText = ""
        }

        // Toggle bold
        isBold = !isBold
        i++ // Skip the second *
      } else {
        // Add current text run
        if (currentText) {
          runs.push(new TextRun({ text: currentText, bold: isBold, italics: isItalic }))
          currentText = ""
        }

        // Toggle italic
        isItalic = !isItalic
      }
    } else {
      currentText += text[i]
    }
  }

  // Add any remaining text
  if (currentText) {
    runs.push(new TextRun({ text: currentText, bold: isBold, italics: isItalic }))
  }

  return runs.length ? runs : [new TextRun({ text })]
}

// Main function to generate DOCX
export async function generateDOCX(content: string, settings: OutputSettings, title = "Video Analysis"): Promise<Blob> {
  // Create document with appropriate settings
  const doc = new Document({
    title,
    description: "Generated by YouTube Video Analyzer",
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: mapFontFamily(settings.fontFamily),
            size: settings.fontSize * 2, // Convert pt to half-points
          },
          paragraph: {
            spacing: {
              line: Math.round(settings.lineSpacing * 240), // Convert to line spacing in twips
              lineRule: LineRuleType.EXACT,
            },
          },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: mapFontFamily(settings.fontFamily),
            size: (settings.fontSize + 8) * 2, // Larger size for headings
            bold: true,
          },
          paragraph: {
            spacing: {
              line: Math.round(settings.lineSpacing * 240), // Apply line spacing to headings too
              lineRule: LineRuleType.EXACT,
            },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: mapFontFamily(settings.fontFamily),
            size: (settings.fontSize + 4) * 2, // Larger size for headings
            bold: true,
          },
          paragraph: {
            spacing: {
              line: Math.round(settings.lineSpacing * 240), // Apply line spacing to headings too
              lineRule: LineRuleType.EXACT,
            },
          },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: mapFontFamily(settings.fontFamily),
            size: (settings.fontSize + 2) * 2, // Larger size for headings
            bold: true,
          },
          paragraph: {
            spacing: {
              line: Math.round(settings.lineSpacing * 240), // Apply line spacing to headings too
              lineRule: LineRuleType.EXACT,
            },
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch in twips (1440 twips = 1 inch)
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Title
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 240,
              after: 480,
              line: Math.round(settings.lineSpacing * 240),
              lineRule: LineRuleType.EXACT,
            },
          }),
          // Content
          ...markdownToDocxElements(content, settings.lineSpacing),
        ],
      },
    ],
  })

  // Generate and return the DOCX file
  return await Packer.toBlob(doc)
}

// Helper function to map font family names
function mapFontFamily(fontFamily: string): string {
  switch (fontFamily) {
    case "Times-Roman":
      return "Times New Roman"
    case "Helvetica":
      return "Helvetica"
    case "Courier":
      return "Courier New"
    default:
      return "Times New Roman"
  }
}
