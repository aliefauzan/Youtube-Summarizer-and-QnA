import { jsPDF } from "jspdf"
import type { OutputSettings } from "@/components/youtube/output-customization"

// Function to convert markdown to plain text (simplified)
function markdownToText(markdown: string): string {
  // Remove headers
  let text = markdown.replace(/#+\s+(.*)/g, "$1\n")

  // Remove bold and italic
  text = text.replace(/\*\*(.*?)\*\*/g, "$1")
  text = text.replace(/\*(.*?)\*/g, "$1")

  // Convert bullet points
  text = text.replace(/^\s*[-*+]\s+(.*)/gm, "• $1")

  // Convert links
  text = text.replace(/\[(.*?)\]$$(.*?)$$/g, "$1")

  // Remove horizontal rules
  text = text.replace(/^---+$/gm, "")

  return text
}

// Function to estimate the number of pages
function estimatePages(text: string, fontSize: number, lineSpacing: number): number {
  // Rough estimation: A4 page with 1 inch margins
  const charsPerLine = Math.floor(180 * (12 / fontSize)) // Adjust based on font size
  const linesPerPage = Math.floor(45 / lineSpacing) // Adjust based on line spacing

  const lines = text.split("\n").reduce((count, line) => {
    return count + Math.ceil(line.length / charsPerLine) || 1
  }, 0)

  return Math.ceil(lines / linesPerPage)
}

// Function to adjust content to meet page requirements
function adjustContentForPageLimits(text: string, settings: OutputSettings, estimatedPages: number): string {
  if (estimatedPages < settings.minPages) {
    // Need to expand content
    return expandContent(text, settings, estimatedPages)
  } else if (estimatedPages > settings.maxPages) {
    // Need to reduce content
    return reduceContent(text, settings, estimatedPages)
  }
  return text
}

// Function to expand content to meet minimum page requirement
function expandContent(text: string, settings: OutputSettings, currentPages: number): string {
  // Simple expansion: add more detailed explanations
  const pagesToAdd = settings.minPages - currentPages

  if (pagesToAdd <= 0) return text

  // Add a note about expansion
  let expanded = text + "\n\n"

  // Add additional sections based on the content style
  if (settings.summaryStyle === "academic") {
    expanded += "## Additional Analysis\n\n"
    expanded += "This section provides a more in-depth analysis of the concepts discussed in the videos.\n\n"

    // Add some paragraphs based on how many pages we need to add
    for (let i = 0; i < pagesToAdd; i++) {
      expanded += "### Extended Discussion " + (i + 1) + "\n\n"
      expanded += "The content presented in the videos can be further analyzed from multiple perspectives. "
      expanded += "When considering the broader implications, several additional factors come into play. "
      expanded += "First, the technological context must be considered within the larger ecosystem. "
      expanded += "Second, the practical applications extend beyond what was explicitly mentioned. "
      expanded += "Third, future developments may take unexpected directions based on emerging trends.\n\n"
      expanded += "Further research in this area would benefit from exploring related concepts and technologies. "
      expanded += "A comparative analysis with alternative approaches would also provide valuable insights. "
      expanded +=
        "Additionally, case studies of successful implementations would enhance understanding of real-world applications.\n\n"
    }

    if (settings.includeReferences) {
      expanded += "## References\n\n"
      expanded += "1. Video sources as cited above\n"
      expanded += "2. Additional academic literature on the subject\n"
      expanded += "3. Industry reports and white papers\n"
      expanded += "4. Expert opinions and analysis\n"
    }
  } else {
    expanded += "## Additional Insights\n\n"
    expanded += "Here are some additional insights and observations about the video content:\n\n"

    for (let i = 0; i < pagesToAdd * 2; i++) {
      expanded += "• The content demonstrates important principles that can be applied in various contexts.\n"
      expanded += "• There are connections between the concepts presented and broader industry trends.\n"
      expanded += "• Practical applications of these ideas continue to evolve as technology advances.\n\n"
    }
  }

  return expanded
}

// Function to reduce content to meet maximum page requirement
function reduceContent(text: string, settings: OutputSettings, currentPages: number): string {
  // Simple reduction: summarize and remove details
  const pagesToRemove = currentPages - settings.maxPages

  if (pagesToRemove <= 0) return text

  // Split into sections
  const sections = text.split(/^##\s+/m)

  // Keep the first section (intro) and reduce others
  let reduced = sections[0]

  // Process each section (except the first one)
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i]
    const sectionTitle = section.split("\n")[0]
    const sectionContent = section.split("\n").slice(1).join("\n")

    // Add section title
    reduced += "## " + sectionTitle + "\n"

    // Reduce bullet points and paragraphs
    const bullets = sectionContent.match(/^\s*[-*+•]\s+(.*)/gm) || []
    const paragraphs = sectionContent.split(/\n\n+/).filter((p) => !p.match(/^\s*[-*+•]\s+/))

    // Keep only the most important bullets (first few)
    const keepBullets = Math.max(2, Math.floor(bullets.length / (pagesToRemove + 1)))
    for (let j = 0; j < keepBullets && j < bullets.length; j++) {
      reduced += bullets[j] + "\n"
    }

    // Keep only the first paragraph of each section
    if (paragraphs.length > 0) {
      reduced += "\n" + paragraphs[0] + "\n\n"
    }
  }

  // Add a note about reduction
  reduced += "\n\n*Note: This content has been condensed to meet the specified page limit requirements.*\n"

  return reduced
}

// Main function to generate PDF
export async function generatePDF(content: string, settings: OutputSettings, title = "Video Analysis"): Promise<Blob> {
  // Create new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Set font and size
  doc.setFont(settings.fontFamily)
  doc.setFontSize(settings.fontSize)

  // Convert markdown to text
  const plainText = markdownToText(content)

  // Estimate pages
  const estimatedPages = estimatePages(plainText, settings.fontSize, settings.lineSpacing)

  // Adjust content if needed
  const adjustedText = adjustContentForPageLimits(plainText, settings, estimatedPages)

  // Set title
  doc.setFontSize(settings.fontSize + 4)
  doc.text(title, 20, 20)
  doc.setFontSize(settings.fontSize)

  // Add content with line spacing
  const lineHeight = settings.fontSize * 0.352778 * settings.lineSpacing // Convert pt to mm
  const margin = 20 // 20mm margins
  const pageWidth = 210 - margin * 2 // A4 width minus margins
  const pageHeight = 297 - margin * 2 // A4 height minus margins

  const lines = doc.splitTextToSize(adjustedText, pageWidth)

  let y = 30 // Start position after title
  let pageCount = 1

  for (let i = 0; i < lines.length; i++) {
    if (y > pageHeight) {
      doc.addPage()
      y = margin
      pageCount++
    }

    doc.text(lines[i], margin, y)
    y += lineHeight
  }

  // Save the PDF
  return doc.output("blob")
}
