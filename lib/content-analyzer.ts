/**
 * Simple text similarity analyzer using TF-IDF approach
 */

// Extract keywords from text (simple implementation)
function extractKeywords(text: string): string[] {
  // Convert to lowercase and remove special characters
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, "")

  // Split into words
  const words = cleanText.split(/\s+/)

  // Filter out common stop words and short words
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "about",
    "against",
    "between",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "from",
    "up",
    "down",
    "of",
    "off",
    "over",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "any",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "s",
    "t",
    "can",
    "will",
    "just",
    "don",
    "should",
    "now",
    "this",
    "that",
  ])

  return words.filter((word) => word.length > 2 && !stopWords.has(word))
}

// Calculate term frequency
function calculateTermFrequency(keywords: string[]): Map<string, number> {
  const termFreq = new Map<string, number>()

  keywords.forEach((word) => {
    termFreq.set(word, (termFreq.get(word) || 0) + 1)
  })

  return termFreq
}

// Calculate similarity score between two texts
export function calculateSimilarity(text1: string, text2: string): number {
  const keywords1 = extractKeywords(text1)
  const keywords2 = extractKeywords(text2)

  const tf1 = calculateTermFrequency(keywords1)
  const tf2 = calculateTermFrequency(keywords2)

  // Find common keywords
  let commonTerms = 0
  let totalUniqueTerms = 0

  // Create a set of all unique terms
  const allTerms = new Set([...tf1.keys(), ...tf2.keys()])
  totalUniqueTerms = allTerms.size

  // Count common terms
  for (const term of allTerms) {
    if (tf1.has(term) && tf2.has(term)) {
      commonTerms++
    }
  }

  // Calculate Jaccard similarity coefficient
  return totalUniqueTerms > 0 ? commonTerms / totalUniqueTerms : 0
}

// Determine if summaries are related based on similarity threshold
export function areRelated(summaries: string[], threshold = 0.15): boolean {
  if (summaries.length <= 1) return false

  // Compare each summary with every other summary
  for (let i = 0; i < summaries.length - 1; i++) {
    for (let j = i + 1; j < summaries.length; j++) {
      const similarity = calculateSimilarity(summaries[i], summaries[j])
      if (similarity >= threshold) {
        return true
      }
    }
  }

  return false
}

// Merge related summaries into a cohesive output
export function mergeSummaries(summaries: string[], titles: string[]): string {
  // Extract key points from all summaries
  const allPoints: string[] = []
  const allOverviews: string[] = []
  const allConclusions: string[] = []

  summaries.forEach((summary) => {
    // Extract overview (first paragraph)
    const overviewMatch = summary.match(/(?:^|\n\n)(.*?)(?:\n\n|$)/)
    if (overviewMatch && overviewMatch[1]) {
      allOverviews.push(overviewMatch[1])
    }

    // Extract bullet points
    const bulletPoints = summary.match(/\* (.*?)(?:\n|$)/g)
    if (bulletPoints) {
      bulletPoints.forEach((point) => {
        allPoints.push(point.trim())
      })
    }

    // Extract conclusion (last paragraph that's not a bullet point)
    const paragraphs = summary.split("\n\n")
    const lastParagraphs = paragraphs.slice(-2)
    for (const para of lastParagraphs) {
      if (!para.trim().startsWith("*") && para.length > 10) {
        allConclusions.push(para)
        break
      }
    }
  })

  // Create merged summary
  let mergedSummary = `# Combined Summary of Related Videos\n\n`

  // Add video titles
  mergedSummary += `## Videos Analyzed\n\n`
  titles.forEach((title, index) => {
    mergedSummary += `${index + 1}. ${title}\n`
  })

  // Add combined overview
  mergedSummary += `\n## Overview\n\n`
  if (allOverviews.length > 0) {
    // Take the most representative overview (longest one)
    const bestOverview = allOverviews.sort((a, b) => b.length - a.length)[0]
    mergedSummary += `${bestOverview}\n\n`
  } else {
    mergedSummary += `These videos discuss related topics.\n\n`
  }

  // Add combined key points (deduplicated)
  mergedSummary += `## Key Points From All Videos\n\n`

  // Simple deduplication by checking for similar starts of sentences
  const uniquePoints = new Set<string>()
  allPoints.forEach((point) => {
    // Get first 5 words to check for similarity
    const firstWords = point.split(" ").slice(0, 5).join(" ").toLowerCase()

    let isDuplicate = false
    uniquePoints.forEach((existingPoint) => {
      const existingFirstWords = existingPoint.split(" ").slice(0, 5).join(" ").toLowerCase()
      if (existingFirstWords.includes(firstWords) || firstWords.includes(existingFirstWords)) {
        isDuplicate = true
      }
    })

    if (!isDuplicate) {
      uniquePoints.add(point)
    }
  })

  uniquePoints.forEach((point) => {
    mergedSummary += `${point}\n`
  })

  // Add combined conclusion
  mergedSummary += `\n## Overall Conclusion\n\n`
  if (allConclusions.length > 0) {
    // Take the most representative conclusion (longest one)
    const bestConclusion = allConclusions.sort((a, b) => b.length - a.length)[0]
    mergedSummary += `${bestConclusion}\n`
  } else {
    mergedSummary += `These videos cover related content and should be considered together for a comprehensive understanding of the topic.\n`
  }

  return mergedSummary
}
