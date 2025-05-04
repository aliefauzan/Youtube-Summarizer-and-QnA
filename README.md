# YouTube Video Analyzer

A web application that allows users to generate summaries and answer specific questions about YouTube videos without requiring any sign-in.

## Features

- Input one or multiple YouTube video URLs
- Video preview with thumbnail, title, and channel information
- Generate summaries using Google's Gemini AI (optimized with gemini-2.0-flash-lite)
- Ask specific questions about video content
- Support for multiple languages (English and Indonesian)
- Intelligent content analysis to detect related videos
- Automatic merging of related video summaries
- Copy summaries and answers to clipboard
- Markdown formatting for easy readability
- Fallback summarization when APIs are unavailable

## Getting Started

### Prerequisites

- Node.js 18 or later
- YouTube API key
- Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Create a `.env.local` file in the root directory with the following variables:

\`\`\`
YOUTUBE_API_KEY=your_youtube_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
\`\`\`

4. Start the development server:

\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

- `YOUTUBE_API_KEY`: Your YouTube Data API v3 key (get from [Google Cloud Console](https://console.cloud.google.com/))
- `GEMINI_API_KEY`: Your Gemini API key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))

## How It Works

### Summarization Mode

1. Users enter one or more YouTube URLs in the input fields
2. The application fetches video metadata and displays compact previews
3. When the user clicks "Summarize Videos", the application:
   - Extracts video IDs from the URLs
   - Fetches video metadata and transcripts in parallel
   - Sends the content to the Gemini API for summarization using the efficient gemini-2.0-flash-lite model
   - Analyzes the summaries for content relevance
   - If videos are related, merges them into a cohesive summary
   - If videos are unrelated, keeps individual summaries
   - Displays the formatted summaries with appropriate indicators

### Question Answering Mode

1. Users enter YouTube URLs and specific questions they want answered
2. Users can select their preferred language (English or Indonesian)
3. When the user clicks "Answer Questions", the application:
   - Processes the videos as in summarization mode
   - Analyzes the video content in relation to the specific questions
   - Generates structured answers to each question based on the video content
   - Formats the answers in a clear, readable format
   - Displays the answers with appropriate context

## Content Analysis

The application uses a text similarity algorithm to determine if videos are related:

1. **Keyword Extraction**: Extracts meaningful keywords from each summary
2. **Similarity Calculation**: Uses a Jaccard similarity coefficient to measure content overlap
3. **Threshold-Based Decision**: Determines if videos are related based on a similarity threshold
4. **Intelligent Merging**: For related videos, combines key points while eliminating duplicates

## Limitations

- The current implementation simulates transcript fetching using video descriptions
- For a production application, you would need to use a specialized YouTube transcript API
- The fallback summarizer provides basic summaries when the Gemini API is unavailable
- The content similarity analysis uses a simple algorithm and may not catch all relationships

## Project Structure

\`\`\`
youtube-summarizer/
├── app/
│   ├── api/
│   │   ├── summarize/
│   │   │   └── route.ts
│   │   ├── analyze/
│   │   │   └── route.ts
│   │   └── youtube/
│   │       └── video-info/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   └── ... (UI components)
│   └── youtube/
│       ├── url-input.tsx
│       ├── video-preview.tsx
│       ├── question-input.tsx
│       └── youtube-summarizer.tsx
├── lib/
│   ├── youtube.ts
│   ├── fallback-summarizer.ts
│   └── content-analyzer.ts
└── ... (config files)
\`\`\`

## Future Improvements

- Implement a real YouTube transcript API for better summaries and analysis
- Add user preferences for summary length and format
- Improve the content similarity algorithm with more advanced NLP techniques
- Add support for playlists and channels
- Implement caching to reduce API calls for previously analyzed videos
- Support additional languages beyond English and Indonesian
- Add export options for summaries and answers (PDF, Word, etc.)
