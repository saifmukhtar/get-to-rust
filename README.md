# Get to Rust: The Book Bible

Welcome to **Get to Rust**, a completely reimagined, mental-model-first approach to learning the Rust programming language. 

Traditional programming books teach you syntax first and hope you eventually understand the "why". This handbook flips the script entirely. Every chapter strictly follows a rigorous pedagogical pipeline:

**Problem -> Motivation -> Mental Model -> CPU -> Syntax -> Kinetic -> Challenge**

By the end of this book, you won't just know how to write Rust syntax—you will understand exactly *why* Rust is designed the way it is, and you will be able to read and write production-level distributed networking code.

## 📖 The Curriculum

The book is broken down into 7 core phases spanning 23 chapters:
- **Phase 1: Foundations** (Variables, Data Types, Mutability, Functions, Scope)
- **Phase 2: The Core Rule** (Stack vs Heap, Ownership, Borrowing, Mutable Borrowing)
- **Phase 3: The Cargo** (Lifetimes, Structs, Enums & Match)
- **Phase 4: The Delivery** (Option, Result, Collections)
- **Phase 5: Architecture** (Impl Blocks, Traits, Modules)
- **Phase 6: Concurrency & Advanced** (Generics, Async, Await, Tokio)
- **Phase 7: Finale** (Reading Real Kinetic Code)

## 🚀 Running the Book Locally

This book is built as a lightning-fast custom Static Site Generator powered by [Vite](https://vitejs.dev/) and `markdown-it`. 

To read the book on your local machine:

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```
Then open the provided `localhost` link in your browser!

## 🧩 Built With
- **Vite** - Dev server and bundler
- **Markdown-it** - Markdown parsing with custom container plugins (`:::mental-model`, `:::cpu`, etc.)
- **Shiki** - Beautiful syntax highlighting
- **Mermaid** - Flowchart rendering

## ⚖️ License

This project is licensed under the **MIT License**. We specifically chose the MIT License because this book contains hundreds of real-world Rust networking snippets. You are completely free to copy, paste, modify, and distribute the code snippets in your own personal and commercial projects without restriction! See the [LICENSE](LICENSE) file for details.
