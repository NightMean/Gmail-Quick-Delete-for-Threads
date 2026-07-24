// ==UserScript==
// @name         Gmail Quick Delete for Threads
// @namespace    https://github.com/NightMean/Gmail-Quick-Delete-for-Threads
// @version      1.2.0
// @description  Adds a native-styled trash icon button right next to the favorite (star) button in Gmail message headers to delete specific messages instantly with zero visual flicker.
// @author       NightMean
// @match        https://mail.google.com/mail/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/NightMean/Gmail-Quick-Delete-for-Threads/main/gmail-quick-delete-for-threads.user.js
// @updateURL    https://raw.githubusercontent.com/NightMean/Gmail-Quick-Delete-for-Threads/main/gmail-quick-delete-for-threads.user.js
// ==/UserScript==

(function() {
    'use strict';

    /**
     * Single source of truth for version number
     */
    const SCRIPT_VERSION = '1.2.0';

    /**
     * Class applied to <body> during single message deletion
     */
    const MASK_CLASS = 'gmail-single-delete-active';

    /**
     * Supported multi-language keywords for the single message delete menu action.
     * Gmail renders menu items based on user interface language settings.
     */
    const DELETE_KEYWORDS = [
        'Odstrániť',               // Slovak
        'Delete this message',     // English
        'Supprimer ce message',    // French
        'Eliminar este mensaje',   // Spanish
        'Nachricht löschen',       // German
        'Elimina questo messaggio',// Italian
        'Excluir esta mensagem',   // Portuguese
        'Удалить это сообщение',   // Russian
        '删除此邮件',               // Chinese (Simplified)
        '刪除此郵件',               // Chinese (Traditional)
        'このメッセージを削除',     // Japanese
        '이 메시지 삭제'            // Korean
    ];

    /**
     * Inject permanent CSS rule that hides menus whenever MASK_CLASS is on <body>
     */
    function injectGlobalStyles() {
        if (document.getElementById('gmail-single-delete-style')) return;
        
        const style = document.createElement('style');
        style.id = 'gmail-single-delete-style';
        style.textContent = `
            body.${MASK_CLASS} [role="menu"],
            body.${MASK_CLASS} .GUpjnc,
            body.${MASK_CLASS} [id^="elptr_"],
            body.${MASK_CLASS} .J-M {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
                transition: none !important;
                animation: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Performs silent, zero-flicker single-message deletion.
     * Keeps the CSS mask active until Gmail has fully unmounted the menu element.
     * @param {Element} moreBtn - The "More options" three-dots button element for the specific message.
     */
    function executeSeamlessDelete(moreBtn) {
        // 1. Activate body class to hide all popup menus via CSS
        document.body.classList.add(MASK_CLASS);

        try {
            // 2. Programmatically click "More options" button to instantiate dropdown
            moreBtn.click();

            // 3. Find and click the matching delete option
            const menuItems = document.querySelectorAll('div[id^="elptr_"] [role="menuitem"], [role="menuitem"], .J-N');
            let deleteItem = null;

            for (const item of menuItems) {
                const text = item.textContent.trim();
                if (DELETE_KEYWORDS.some(keyword => text === keyword || text.startsWith(keyword))) {
                    deleteItem = item;
                    break;
                }
            }

            if (deleteItem) {
                deleteItem.click();
            } else {
                // If not matched, dismiss menu safely
                const escEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true });
                document.dispatchEvent(escEvent);
                console.warn('[Gmail Quick Delete] Could not match delete action in dropdown menu.');
            }
        } catch (err) {
            console.error('[Gmail Quick Delete] Error during deletion execution:', err);
        } finally {
            // 4. Defer removing the mask class for 400ms.
            // This guarantees Gmail finishes its menu closing animation/unmounting out of sight.
            setTimeout(() => {
                document.body.classList.remove(MASK_CLASS);
            }, 400);
        }
    }

    /**
     * Injects the custom Delete button next to the Star button in expanded message headers
     */
    function injectDeleteButtons() {
        // Ensure global hide styles are present
        injectGlobalStyles();

        // Query visible star buttons inside expanded message headers (.zd.SKW8Ab)
        const starButtons = Array.from(document.querySelectorAll('.zd.SKW8Ab')).filter(el => el.offsetWidth > 0);
        
        starButtons.forEach(star => {
            const starContainer = star.parentElement;
            if (!starContainer) return;
            
            // Locate parent container (.gK) holding the header metadata & action icons
            const gk = starContainer.parentElement;
            if (!gk || gk.tagName !== 'DIV' || !gk.classList.contains('gK')) return;
            
            // Prevent duplicate button injections
            if (gk.querySelector('.custom-trash-button')) return;
            
            // Create wrapper element styled identically to Gmail's native action icon buttons
            const trashBtn = document.createElement('div');
            trashBtn.className = 'custom-trash-button';
            trashBtn.setAttribute('role', 'button');
            trashBtn.setAttribute('title', 'Odstrániť správu (Delete message)');
            trashBtn.setAttribute('data-version', SCRIPT_VERSION);
            
            // Apply exact native sizing, border-radius, and flex spacing (40x40px touch area, 2px margins)
            Object.assign(trashBtn.style, {
                display: 'inline-flex',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '2px',
                marginRight: '2px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                backgroundColor: 'transparent',
                verticalAlign: 'middle'
            });
            
            // Construct SVG icon using createElementNS for TrustedHTML policy compliance
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 -960 960 960');
            svg.setAttribute('height', '20');
            svg.setAttribute('width', '20');
            svg.setAttribute('fill', '#5f6368');
            svg.style.pointerEvents = 'none';

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z');

            svg.appendChild(path);
            trashBtn.appendChild(svg);
            
            // Native circular backdrop hover effects
            trashBtn.addEventListener('mouseenter', () => {
                trashBtn.style.backgroundColor = 'rgba(60, 64, 67, 0.08)';
            });
            trashBtn.addEventListener('mouseleave', () => {
                trashBtn.style.backgroundColor = 'transparent';
            });
            
            // Delete action event listener
            trashBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                // Locate parent table row of this message header section
                let tr = gk.parentElement;
                while (tr && tr.tagName !== 'TR') {
                    tr = tr.parentElement;
                }
                if (!tr) return;
                
                // Find the "More options" (three dots) button within this header row
                const moreBtn = tr.querySelector('.Wsq5Cf, [aria-label*="možnosti správy"], [aria-label*="options"]');
                if (!moreBtn) {
                    console.warn('[Gmail Quick Delete] "More options" button not found for this message.');
                    return;
                }
                
                // Execute zero-flicker deletion
                executeSeamlessDelete(moreBtn);
            });
            
            // Insert the custom delete button right next to the star button container
            starContainer.after(trashBtn);
        });
    }

    // Debounced MutationObserver to detect message expansion and DOM changes dynamically
    let debounceTimeout = null;
    const observer = new MutationObserver(() => {
        if (debounceTimeout) clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(injectDeleteButtons, 100);
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Initial DOM scan on load
    injectDeleteButtons();
    console.log(`[Gmail Quick Delete v${SCRIPT_VERSION}] Initialized successfully.`);
})();
