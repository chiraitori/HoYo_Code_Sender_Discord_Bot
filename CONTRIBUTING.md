# Contributing to HoYo Code Sender Discord Bot

Thank you for your interest in contributing to the HoYo Code Sender Discord Bot! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Code Contributions](#code-contributions)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Translation Contributions](#translation-contributions)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [mail@chiraitori.io.vn](mailto:mail@chiraitori.io.vn).

## Getting Started

Before you begin:

1. Make sure you have a [GitHub account](https://github.com/signup)
2. Familiarize yourself with the project by reading the [documentation](https://github.com/chiraitori/HoYo_Code_Sender_Discord_Bot/wiki)
3. Check existing [issues](https://github.com/chiraitori/HoYo_Code_Sender_Discord_Bot/issues) before creating a new one

## How to Contribute

### Reporting Bugs

If you find a bug in the bot, please create an issue on our [GitHub repository](https://github.com/chiraitori/HoYo_Code_Sender_Discord_Bot/issues) using the bug report template. Include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (Discord client, browser, OS)
- Any additional context that might help resolve the issue

### Suggesting Features

We welcome suggestions for new features or improvements! Create an issue using the feature request template and include:

- A clear description of the feature
- The problem it solves
- How it would benefit users
- Any implementation ideas you have
- Mockups or examples, if applicable

### Code Contributions

To contribute code to the project:

1. Fork the repository
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes with clear, descriptive messages
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request to the main repository

## Development Setup

To set up the project locally for development:

1. Clone your forked repository
   ```powershell
   git clone https://github.com/your-username/HoYo_Code_Sender_Discord_Bot.git
   cd HoYo_Code_Sender_Discord_Bot
   ```

2. Install dependencies
   ```powershell
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   MONGODB_URI=your_mongodb_connection_string
   CLIENT_ID=your_discord_client_id
   OWNER_ID=your_id_in_discord
   ```

4. Run the bot in development mode
   ```powershell
   npm run dev
   ```

## Pull Request Process

1. Ensure your code follows our style guidelines
2. Update documentation as necessary
3. Include tests for new functionality
4. Ensure all tests pass
5. Link any relevant issues in your pull request description
6. Request a review from a maintainer

Your pull request will be reviewed by a maintainer who may suggest changes or improvements before merging.

## Style Guidelines

To maintain code quality and consistency:

### JavaScript

- Use ES6 features where appropriate
- Use meaningful variable and function names
- Add comments for complex logic
- Follow consistent indentation (2 spaces)
- Use semicolons

### Commits

- Use clear, descriptive commit messages
- Reference issue numbers when applicable
- Use present tense ("Add feature" not "Added feature")

## Translation Contributions

We welcome translations to make the bot accessible to more users:

1. Check the `lang` directory to see existing translations
2. To add a new language:
   - Create a new file in the `lang` directory named with the language code (e.g., `de.js` for German)
   - Use the `en.js` file as a template and translate all strings
   - Update the language options in the `setlang.js` command

## Community

Join our [Discord support server](https://dsc.gg/chiraitori-support) to:
- Get help with development
- Discuss ideas and improvements
- Connect with other contributors
- Stay updated on project news

## Thank You!

Your contributions help make this project better for everyone. We appreciate your time and effort!