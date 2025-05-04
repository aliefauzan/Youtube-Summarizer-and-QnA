# YouTube Video Analyzer with Custom Output

A web application that allows users to generate summaries and answer specific questions about YouTube videos with customizable output formats and styles.

## Features

- Input one or multiple YouTube video URLs
- Video preview with thumbnail, title, and channel information
- Generate summaries using Google's Gemini AI (optimized with gemini-2.0-flash-lite)
- Ask specific questions about video content
- Support for multiple languages (English and Indonesian)
- Intelligent content analysis to detect related videos
- Automatic merging of related video summaries
- Customizable output formats (Markdown, PDF)
- Formatting options for PDF output:
  - Font family (Times New Roman, Helvetica, Courier)
  - Font size
  - Line spacing
  - Page limits (minimum and maximum)
- Content style options (concise, detailed, academic)
- Copy summaries and answers to clipboard
- Download as PDF with proper formatting
- Predefined question templates for different analysis types
- Support for blockchain and smart contract specific questions

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
3. Users can customize output settings (format, style, etc.)
4. When the user clicks "Summarize Videos", the application:
   - Extracts video IDs from the URLs
   - Fetches video metadata and transcripts in parallel
   - Sends the content to the Gemini API for summarization
   - Analyzes the summaries for content relevance
   - Formats the output according to user preferences
   - Allows downloading as PDF if that format is selected

### Question Answering Mode

1. Users enter YouTube URLs and specific questions they want answered
2. Users can select their preferred language (English or Indonesian)
3. Users can use predefined question templates or create custom questions
4. Users can customize output settings (format, style, etc.)
5. When the user clicks "Answer Questions", the application:
   - Processes the videos as in summarization mode
   - Analyzes the video content in relation to the specific questions
   - Generates structured answers to each question based on the video content
   - Formats the answers according to user preferences
   - Allows downloading as PDF if that format is selected

## PDF Generation

The application can generate properly formatted PDF documents with:

1. User-specified font family (Times New Roman, Helvetica, Courier)
2. Custom font size
3. Adjustable line spacing
4. Content that meets specified page limits
5. Proper headings and structure
6. Optional references section

The PDF generator automatically adjusts content to meet the specified page limits by:
- Expanding content with additional analysis if below minimum page count
- Condensing content by focusing on key points if above maximum page count

## Question Templates

The application includes predefined question templates for different types of analysis:

1. **Academic Analysis** - Structured questions for formal academic analysis
2. **Technical Review** - Questions focused on technical aspects and implementation
3. **Business Analysis** - Questions focused on business value and market analysis
4. **Blockchain Template** - Specialized questions for blockchain and smart contract analysis

Templates are available in both English and Indonesian.

## Limitations

- The current implementation simulates transcript fetching using video descriptions
- For a production application, you would need to use a specialized YouTube transcript API
- PDF page estimation is approximate and may not exactly match printed output
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
│       ├── output-customization.tsx
│       └── youtube-summarizer.tsx
├── lib/
│   ├── youtube.ts
│   ├── fallback-summarizer.ts
│   ├── content-analyzer.ts
│   └── pdf-generator.ts
└── ... (config files)
\`\`\`

## Future Improvements

- Implement a real YouTube transcript API for better summaries and analysis
- Add more output formats (DOCX, HTML, etc.)
- Improve the PDF generation with better page estimation and formatting
- Add support for playlists and channels
- Implement caching to reduce API calls for previously analyzed videos
- Support additional languages beyond English and Indonesian
- Add collaborative analysis features for team projects
- Implement user accounts to save and manage analyses
