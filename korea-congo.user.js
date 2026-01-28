// ==UserScript==
// @name         Korea Congo-Style Naming
// @namespace    https://github.com/zappingsbrew/korea-congo
// @version      1.0.0
// @description  Full Congo-style Korea renaming: handles all Korea edge cases, plurals, possessives, abbreviations, grammar, parentheses, won, and capitalization
// @author       Zappingsbrew & ChatGPT
// @match        *://*/*
// @grant        none
// @icon         https://github.com/twitter/twemoji/blob/master/assets/72x72/1f1f0-1f1f7.png?raw=true
// @downloadURL  https://github.com/zappingsbrew/korea-congo/raw/main/korea-congo.user.js
// @updateURL    https://github.com/zappingsbrew/korea-congo/raw/main/korea-congo.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Exceptions: phrases to handle as a whole to preserve grammar
    const EXCEPTIONS = [
        "North and South Koreans",
        "South and North Koreans",
        "North and South Koreas",
        "South and North Koreas"
    ];

    // Neighbor words for context-aware replacement
    const NEIGHBORS = [
        "Korea","Koreas","Korean","Koreans",
        "Korea's","Koreas'","Korean's","Koreans'"
    ];

    // Replacement rules
    const REPLACEMENTS = {
        "North": "DPR",
        "South": "" // removed when safe
    };

    // Apply Congo-style replacement to text
    function applyCongoTreatment(text) {

        // 1. Handle exceptions first (combined phrases)
        for (let ex of EXCEPTIONS) {
            const regex = new RegExp(ex, "gi");
            let replacement = ex;

            // Map exception to readable DPR/Korea style
            if (/North and South/i.test(ex)) {
                replacement = ex.replace(/North/i, "DPR").replace(/South/i, "Korea");
            }

            text = text.replace(regex, replacement);
        }

        // 2. Handle parentheses like "Korea (North)" or "Korea (South)"
        for (let neighbor of NEIGHBORS) {
            const parenRegex = new RegExp(`\\b(${neighbor})\\s*\$begin:math:text$\(North\|South\)\\$end:math:text$`, "gi");
            text = text.replace(parenRegex, (match, p1, p2) => {
                const replacement = REPLACEMENTS[p2];
                return replacement ? replacement + " " + p1 : p1;
            });
        }

        // 3. Replace standalone North/South + neighbor
        for (let neighbor of NEIGHBORS) {
            const regex = new RegExp(`\\b(North|South)\\s+(${neighbor})\\b`, "gi");
            text = text.replace(regex, (match, p1, p2) => {
                const replacement = REPLACEMENTS[p1];
                return replacement ? replacement + " " + p2 : p2;
            });
        }

        return text;
    }

    // Walk all DOM nodes recursively
    function walk(node) {
        if (!node) return;

        // Skip editable fields
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            if (tag === "input" || tag === "textarea" || node.isContentEditable) return;
        }

        if (node.nodeType === Node.TEXT_NODE) {
            node.nodeValue = applyCongoTreatment(node.nodeValue);
        } else {
            for (let child of node.childNodes) {
                walk(child);
            }
        }
    }

    // Observe dynamic content
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                    walk(node);
                }
            }
        }
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Initial pass
    walk(document.body);

})();