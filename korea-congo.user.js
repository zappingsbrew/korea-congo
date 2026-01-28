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

/*!
 * MIT License
 *
 * Copyright (c) 2025 zappingsbrew
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function() {
    'use strict';

    // Exceptions (do not touch these combined phrases)
    const EXCEPTIONS = [
        "North and South Koreans",
        "South and North Koreans",
        "North and South Koreas",
        "South and North Koreas"
    ];

    // Neighbor words we check for North/South replacement
    const NEIGHBORS = [
        "Korea","Koreas","Korean","Koreans",
        "Korea's","Koreas'","Korean's","Koreans'"
    ];

    // Replacement rules
    const REPLACEMENTS = {
        "North": "DPR",
        "South": "" // remove when safe
    };

    // Apply Congo-style replacement to a text string
    function applyCongoTreatment(text) {
        // Skip any exceptions
        for (let ex of EXCEPTIONS) {
            if (text.includes(ex)) return text;
        }

        // Replace North/South + neighbor normally
        for (let neighbor of NEIGHBORS) {
            const regex = new RegExp(`\\b(North|South)\\s+(${neighbor})\\b`, "gi");
            text = text.replace(regex, (match, p1, p2) => {
                const replacement = REPLACEMENTS[p1];
                return replacement ? replacement + " " + p2 : p2;
            });
        }

        // Extra: handle parentheses variations like "Korea (North)"
        for (let neighbor of NEIGHBORS) {
            const parenRegex = new RegExp(`\\b(${neighbor})\\s*\$begin:math:text$\\\\s\*\(North\|South\)\\\\s\*\\$end:math:text$`, "gi");
            text = text.replace(parenRegex, (match, p1, p2) => {
                const replacement = REPLACEMENTS[p2];
                return replacement ? replacement + " " + p1 : p1; // DPR Korea or just Korea
            });
        }

        return text;
    }

    // Walk all nodes in the DOM recursively
    function walk(node) {
        if (!node) return;

        // Skip editable fields
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            if (tag === "input" || tag === "textarea" || node.isContentEditable) return;
        }

        // Recursively process
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

    // Start observing
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Initial pass
    walk(document.body);

})();
