import * as text from "@skeldjs/text";

function getTextElements(element: text.TMPElement|string): string {
    if (typeof element === "string") {
        return element;
    }

    return element.children.map(x => getTextElements(x)).join("");
}

export function stripTMP(tmp: string) {
    const parsed = text.parseTMP(tmp);
    return getTextElements(parsed);
}