# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static HTML/JavaScript frequency analysis tool for cryptographic ciphers, specifically designed for analyzing English-based encrypted text. The tool is part of the "100 Security Tools with Generative AI" project (Day 9).

## Development Commands

Since this is a static web application with no build process, development is straightforward:

- **Local development**: Open `index.html` directly in a browser or use a simple HTTP server
- **Testing changes**: Refresh the browser after editing files
- **No package manager**: This project uses vanilla HTML/CSS/JavaScript with no dependencies

## Code Architecture

### Core Components

**HTML Structure (`index.html`)**
- Main input textarea for cipher text
- Frequency analysis results display (table and SVG chart)
- Character mapping interface with system guesses and manual adjustments
- Decoded text output with highlighting

**JavaScript Logic (`main.js`)**
- `analyze()`: Main analysis function that processes input text and updates all displays
- `generateSystemGuess()`: Creates automatic ETAOIN-based character mappings
- `createMappingTable()`: Builds the interactive mapping interface
- `decodeText()`: Applies current mappings to show decoded results
- `drawFrequencyChart()`: Renders SVG bar chart of character frequencies

**Data Flow**:
1. User inputs cipher text → `analyze()` processes it
2. Character frequencies calculated and displayed
3. System generates ETAOIN-based mapping suggestions
4. User can manually adjust mappings via input fields
5. Real-time decoding shows results with change highlighting

### Key Features

- **Frequency Analysis**: Counts and visualizes character occurrences
- **ETAOIN Mapping**: Auto-suggests mappings based on English letter frequency
- **Interactive Mapping**: Manual adjustment with duplicate detection
- **Live Preview**: Real-time decoding with highlighted changes
- **Visual Feedback**: SVG charts and animated text changes

### Security Tool Context

This is a defensive cryptanalysis tool for:
- Caesar cipher analysis
- Monoalphabetic substitution cipher breaking
- Vigenère cipher analysis (after column separation)
- Educational cryptography demonstrations

## File Structure

- `index.html`: Main application interface
- `main.js`: Core frequency analysis and decoding logic  
- `style.css`: Visual styling and layout
- `README.md`: Project documentation in Japanese
- `screenshot.png`: Application screenshot for documentation