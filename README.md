<div align="center">
  <h1>Gmail Quick Delete for Threads</h1>
  <p>A lightweight Tampermonkey userscript that adds a single-message delete button right next to the star button in Gmail message headers.</p>
</div>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
</p>

## Overview

In multi-message Gmail conversation threads, deleting a single email normally requires opening the message kebab menu and scrolling down to find "Delete this message".

Gmail Quick Delete for Threads places a native-styled trash button directly next to the favorite star button in every expanded message header. It deletes the specific message immediately without screen flicker or full thread removal.

## Features

- Zero-flicker instant single-message deletion: Deletes individual emails inside conversation threads with 0ms visual menu flash or popup animation.
- Native Gmail styling: Matches Gmail's exact action icon aesthetics (circular hover container, standard padding, native SVG icon).
- Multi-language support: Automatically recognizes delete actions across 12 interface languages (Slovak, English, German, French, Spanish, Italian, Portuguese, Russian, Chinese, Japanese, Korean, and Czech).
- TrustedHTML compliant: Constructs SVG element nodes safely using `createElementNS` to satisfy Chrome and Gmail Content Security Policies.
- Efficient MutationObserver: Automatically attaches action buttons when expanding collapsed messages or dynamically loading new emails.

## Requirements

A compatible userscript manager installed in your browser:
- [Tampermonkey](https://www.tampermonkey.net/)
- [Violentmonkey](https://violentmonkey.github.io/)

## Installation

1. Install a userscript manager in your web browser.
2. Open [`gmail-quick-delete-for-threads.user.js`](https://raw.githubusercontent.com/NightMean/Gmail-Quick-Delete-for-Threads/main/gmail-quick-delete-for-threads.user.js) in your browser.
3. Confirm the installation in your userscript manager prompt.

## Usage

1. Open Gmail (`https://mail.google.com/`).
2. Open any conversation thread containing multiple messages.
3. Each expanded message header displays a trash icon beside the star button.
4. Click the trash icon to delete only that specific email.

## Donations

If you find this project useful, you can support its maintenance:

- [GitHub Sponsors](https://github.com/sponsors/NightMean)
- [Buy Me a Coffee](https://buymeacoffee.com/nightmean)
- [Ko-fi](https://ko-fi.com/nightmean)

## License

This project is licensed under the [MIT License](LICENSE).
