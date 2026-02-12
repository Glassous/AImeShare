# AImeShare

AImeShare is a modern, lightweight AI conversation viewer built with React, TypeScript, and Vite. It provides a beautiful, Material Design 3 inspired interface for sharing and viewing AI conversations stored in Supabase.

## Features

- **UUID-based Sharing**: Access conversations via unique links (e.g., `/share/:uuid`).
- **Rich Content Rendering**:
  - Full **Markdown** support (GFM).
  - **LaTeX** mathematical rendering (using KaTeX).
  - **Syntax Highlighting** for code blocks (using Prism).
- **Deep Thinking Process**: Special support for `<think>` tags, rendering them as collapsible "Deep Thinking Process" blocks with smooth animations.
- **Interactive Elements**:
  - **Collapsible Code Blocks**: Expand/collapse code snippets for better readability.
  - **Copy to Clipboard**: One-click copy for user messages, AI responses, and individual code blocks.
  - **CSV Export**: Instantly download data tables as CSV files.
- **Theming**:
  - Material Design 3 (MD3) styling.
  - **Theme Switcher**: Support for Light, Dark, and System Preference modes (persisted via local storage).
- **Responsive Design**: Optimized for various screen sizes with a clean, distraction-free reading experience.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Database**: Supabase
- **Styling**: Pure CSS (MD3 variables), Lucide React (icons)
- **Rendering**: 
  - `react-markdown`
  - `remark-math`, `rehype-katex`
  - `react-syntax-highlighter`

## Setup & Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Glassous/AImeShare.git
    cd aimeshare
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file in the root directory based on `.env.example`:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
