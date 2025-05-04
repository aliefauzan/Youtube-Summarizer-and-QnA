/**
 * A simple fallback summarizer that works without external APIs
 * This is used when the Gemini API is unavailable
 */
export function generateBasicSummary(text: string, title: string): string {
  // Extract the title and description
  const titleMatch = text.match(/Title: (.*?)(?:\n|$)/)
  const descriptionMatch = text.match(/Description: ([\s\S]*?)(?:\n\n|\(This is a simulated|$)/)

  const extractedTitle = titleMatch ? titleMatch[1] : title
  const description = descriptionMatch ? descriptionMatch[1].trim() : ""

  // Create a simple summary
  let summary = `### ${extractedTitle}\n\n`

  // Add a brief overview
  summary +=
    "This video appears to be about " +
    (extractedTitle.toLowerCase().includes("how")
      ? "a tutorial or guide"
      : "a topic related to " + extractedTitle.split(" ").slice(0, 3).join(" ")) +
    ".\n\n"

  // Add key points
  summary += "#### Key points:\n\n"

  if (description) {
    // Extract sentences from description (simple approach)
    const sentences = description
      .split(/[.!?]/)
      .filter((s) => s.trim().length > 10)
      .slice(0, 5)

    if (sentences.length > 0) {
      sentences.forEach((sentence) => {
        summary += `* ${sentence.trim()}\n`
      })
    } else {
      summary += "* Limited information available from the video description\n"
      summary += "* Consider watching the full video for more details\n"
    }
  } else {
    summary += "* Limited information available from the video\n"
    summary += "* Consider watching the full video for more details\n"
  }

  // Add conclusion
  summary += "\n#### Summary:\n\n"
  summary +=
    "This is a basic summary generated without AI assistance. For a more detailed summary, please try again when the AI service is available."

  return summary
}
