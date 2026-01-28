// ==UserScript==
// @name         Korea Congo-Style Naming
// @namespace    https://github.com/zappingsbrew/korea-congo
// @version      1.0.0
// @description  Aggressively renames North/South Korea while preserving coordinated phrases, plurals, possessives, parentheses, and capitalization; handles dynamic content like search snippets and infinite scroll
// @author       Zappingsbrew & ChatGPT
// @match        *://*/*
// @grant        none
// @icon         https://github.com/twitter/twemoji/blob/master/assets/72x72/1f1f0-1f1f7.png?raw=true
// @downloadURL  https://github.com/zappingsbrew/korea-congo/raw/main/korea-congo.user.js
// @updateURL    https://github.com/zappingsbrew/korea-congo/raw/main/korea-congo.user.js
// @license      MIT
// ==/UserScript==

/*!
 * MIT License
 *
 * Copyright (c) 2026 Zappingsbrew
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

    const NEIGHBORS = [
        "Korea","Koreas","Korean","Koreans",
        "Korea's","Koreas'","Korean's","Koreans'"
    ];

    // Fully whitelisted coordinated phrases (North+South / South+North)
    const EXCEPTIONS = [
        "North and South Koreans",
        "South and North Koreans",
        "North and South Koreas",
        "South and North Koreas",
        "North and South Korea",
        "South and North Korea",
        "North and South Korea's",
        "South and North Korea's",
        "North and South Koreans'",
        "South and North Koreans'",
        "North and South Korean's",
        "South and North Korean's"
    ];

    const REPLACEMENTS = {
        "North": "DPR",
        "South": "" // remove South when safe
    };

    function applyCongoTreatment(text) {
        if (!text) return text;

        // 1. Protect coordinated phrases
        for (let ex of EXCEPTIONS) {
            const regex = new RegExp(ex, "gi");
            text = text.replace(regex, ex);
        }

        // 2. Handle parentheses variations: "Korea (North)" / "Korea (South)"
        for (let neighbor of NEIGHBORS) {
            const parenRegex = new RegExp(`\\b(${neighbor})\\s*\$begin:math:text$\(North\|South\)\\$end:math:text$`, "gi");
            text = text.replace(parenRegex, (match, p1, p2) => {
                const replacement = REPLACEMENTS[p2];
                return replacement ? replacement + " " + p1 : p1;
            });
        }

        // 3. Standalone North/South + neighbor
        for (let neighbor of NEIGHBORS) {
            const regex = new RegExp(`\\b(North|South)\\s+(${neighbor})\\b`, "gi");
            text = text.replace(regex, (match, p1, p2) => {
                // Ensure coordinated phrases are preserved
                for (let ex of EXCEPTIONS) {
                    if (match.toLowerCase() === ex.toLowerCase()) return match;
                }
                const replacement = REPLACEMENTS[p1];
                return replacement ? replacement + " " + p2 : p2;
            });
        }

        return text;
    }

    function walk(node) {
        if (!node) return;

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

    // Delayed secondary pass
    setTimeout(() => walk(document.body), 2000);

    // Periodic re-check every 2 seconds
    setInterval(() => walk(document.body), 2000);

})();