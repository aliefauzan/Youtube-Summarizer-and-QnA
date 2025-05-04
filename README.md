<div align="center">
  <h1>YouTube Summarizer and QnA</h1>
  <img src="https://github.com/aliefauzan/Youtube-Summarizer-and-QnA/blob/main/Showcase.jpg?raw=true" alt="Screenshot" width="600px" />
</div>
<div align="center">
  <img src="https://github.com/aliefauzan/Youtube-Summarizer-and-QnA/blob/main/Showcase1.jpg?raw=ture" alt="Screenshot1" width="600px" />
</div>

# YouTube Video Analyzer with Multilingual Support and Document Editing

A comprehensive web application that allows users to generate summaries and answer specific questions about YouTube videos with customizable output formats, styles, and languages, plus document editing capabilities.

## Features

### Core Functionality
- Input one or multiple YouTube video URLs
- Video preview with thumbnail, title, and channel information
- Generate summaries using Google's Gemini AI
- Ask specific questions about video content
- Intelligent content analysis to detect related videos
- Automatic merging of related video summaries

### Multilingual Support
- Support for 12+ languages including English, Indonesian, Spanish, French, German, Chinese, Japanese, Korean, Arabic, Hindi, Portuguese, and Russian
- Language-specific question templates
- Proper formatting and style for each language

### Document Customization
- Customizable output formats (Markdown, PDF, DOCX)
- Formatting options for documents:
  - Font family (Times New Roman, Helvetica, Courier)
  - Font size
  - Line spacing
  - Page limits (minimum and maximum)
- Content style options (concise, detailed, academic)
- Formal or informal tone selection

### Document Editing and Feedback
- Built-in document editor for reviewing and modifying generated content
- Feedback submission for AI-assisted improvements
- Save edits and regenerate content with feedback incorporated
- Document version tracking

### Export Options
- Copy to clipboard
- Download as PDF with proper formatting
- Download as DOCX (Microsoft Word) with proper formatting

### Question Templates
- Predefined question templates for different analysis types
- Support for blockchain and smart contract specific questions
- Custom question creation

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
3. Users can customize output settings (format, style, language, etc.)
4. When the user clicks "Summarize Videos", the application:
   - Extracts video IDs from the URLs
   - Fetches video metadata and transcripts in parallel
   - Sends the content to the Gemini API for summarization in the selected language
   - Analyzes the summaries for content relevance
   - Formats the output according to user preferences
   - Allows downloading as PDF or DOCX if those formats are selected

### Question Answering Mode

1. Users enter YouTube URLs and specific questions they want answered
2. Users can select their preferred language
3. Users can use predefined question templates or create custom questions
4. Users can customize output settings (format, style, etc.)
5. When the user clicks "Answer Questions", the application:
   - Processes the videos as in summarization mode
   - Analyzes the video content in relation to the specific questions
   - Generates structured answers to each question based on the video content
   - Formats the answers according to user preferences
   - Allows downloading as PDF or DOCX if those formats are selected

### Document Editing Workflow

1. Users can enter edit mode after content generation
2. The document editor allows direct editing of the content
3. Users can provide feedback or notes about their changes
4. Users can save their edits and regenerate the content with their feedback
5. The system incorporates user feedback into the regenerated content

## Document Generation

### PDF Generation
The application generates properly formatted PDF documents with:
- User-specified font family, size, and line spacing
- Content that meets specified page limits
- Proper headings and structure
- Optional references section

### DOCX Generation
The application generates Microsoft Word documents with:
- Proper formatting and styles
- Headings and structure preserved from markdown
- Font and spacing settings applied
- Compatible with Microsoft Word and other word processors

## Multilingual Support

The application supports multiple languages for both input and output:
- User interface elements are available in multiple languages
- Question templates are provided in different languages
- Generated content is in the selected language
- Formatting and style are adapted to language conventions

## Limitations

- The current implementation simulates transcript fetching using video descriptions
- For a production application, you would need to use a specialized YouTube transcript API
- PDF and DOCX page estimation is approximate and may not exactly match printed output
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
│       ├── language-selector.tsx
│       ├── document-editor.tsx
│       └── youtube-summarizer.tsx
├── lib/
│   ├── youtube.ts
│   ├── fallback-summarizer.ts
│   ├── content-analyzer.ts
│   ├── pdf-generator.ts
│   └── docx-generator.ts
└── ... (config files)
\`\`\`

## Future Improvements

- Implement a real YouTube transcript API for better summaries and analysis
- Add more output formats (HTML, LaTeX, etc.)
- Improve the document generation with better page estimation and formatting
- Add support for playlists and channels
- Implement caching to reduce API calls for previously analyzed videos
- Support additional languages
- Add collaborative analysis features for team projects
- Implement user accounts to save and manage analyses
- Add more advanced document editing features (track changes, comments, etc.)
- Integrate with cloud storage services for document management
