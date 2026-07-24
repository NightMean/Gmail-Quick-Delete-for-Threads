# Gmail Quick Delete for Threads - Technical Learnings

This document summarizes the DOM reverse engineering and architectural findings captured during the creation and refinement of the **Gmail Quick Delete for Threads** Tampermonkey script.

---

## 1. Technical Limitations of Gmail's Internal Architecture

### Why Single-Message Deletion Uses the Context Menu
1. **Lazy Action Registration**: Gmail is compiled with Google Web Toolkit (GWT) / Google Closure. Single message handlers (unlike whole-thread archiving or deleting) are **not** exposed on global JS objects (`window.gapi` or global functions).
2. **Context-Bound Scope**: The backend call for deleting *message #3 in a thread of 5 messages* requires internal state tokens bound specifically to that message container.
3. **Synchronous Menu Binding**: When the three-dot ("More options") menu button is clicked, Gmail dynamically instantiates a menu container (`div[id^="elptr_"][class*="GUpjnc"]`) under `<body>` and binds the message-specific closure handler to `[role="menuitem"]`.

---

## 2. Solving the Split-Second Menu Flash (v1.2.0 Improvement)

### Root Cause of the Split-Second Flash in v1.1.0
In v1.1.0, the style mask was removed inside a `finally` block synchronously after `deleteItem.click()`. 
However, when `deleteItem.click()` was called, Gmail started a ~150–300ms closing/unmounting animation. Because `finally` removed the style mask immediately, the closing animation became visible on screen for a split second right as the menu was unmounting.

### The Solution: Deferred Mask Cleanup
To guarantee **absolute zero flicker**, v1.2.0 introduces a persistent style mask combined with a deferred `400ms` body class removal:

```css
/* Permanent style rule in document.head */
body.gmail-single-delete-active [role="menu"],
body.gmail-single-delete-active .GUpjnc,
body.gmail-single-delete-active [id^="elptr_"],
body.gmail-single-delete-active .J-M {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    transition: none !important;
    animation: none !important;
}
```

```javascript
// Function execution
document.body.classList.add('gmail-single-delete-active');

try {
    moreBtn.click();       // Instantiates menu hidden via CSS
    deleteItem.click();    // Dispatches click action
} finally {
    // Keep mask active for 400ms so Gmail's unmount animation finishes out of sight
    setTimeout(() => {
        document.body.classList.remove('gmail-single-delete-active');
    }, 400);
}
```

### Result:
- **Absolute Zero Flicker**: The menu remains hidden with `display: none !important` and `opacity: 0 !important` through both its opening **and** closing phases.
- **Native Experience**: The user experiences an instantaneous single-click message deletion.

---

## 3. Icon Sizing, Spacing & Visual Tokens

To ensure the custom delete button is visually indistinguishable from native Gmail header buttons:

| CSS Property | Value / Specification | Rationale |
| :--- | :--- | :--- |
| **Container Dimensions** | `width: 40px; height: 40px;` | Matches standard Google Material touch target standards. |
| **Flex Alignment** | `display: inline-flex; align-items: center; justify-content: center;` | Centers SVG vertically and horizontally. |
| **Margins / Spacing** | `margin-left: 2px; margin-right: 2px;` | Matches native icon spacing in `.gK` and `.Wsq5Cf`. |
| **Border Radius** | `border-radius: 50%` | Perfect circular hover backdrop. |
| **Hover Color** | `rgba(60, 64, 67, 0.08)` | Google Material gray hover overlay with `0.15s` transition. |
| **SVG Dimensions** | `20px x 20px` (`viewBox="0 -960 960 960"`) | Matches Google Material Symbols standard size. |
| **SVG Color** | `#5f6368` | Native Gmail header icon neutral gray fill. |

---

## 4. TrustedHTML & CSP Security Compliance

Gmail enforces strict Content Security Policies (`TrustedHTML` policy). Inserting raw HTML strings via `innerHTML` or `insertAdjacentHTML` causes browser security policy violations.

**Solution**:
We construct all DOM nodes programmatically using standard DOM APIs:
- `document.createElement('div')`
- `document.createElementNS('http://www.w3.org/2000/svg', 'svg')`
- `document.createElementNS('http://www.w3.org/2000/svg', 'path')`
