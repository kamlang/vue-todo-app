/* Icons name refers to: https://fonts.google.com/icons?icon.style=Outlined
 * "$" sign use as a place holder to insert text or position cursor.
 */
import type { MarkdownsDefinitions } from './types'

const markdownsDefinitions = {
  bold: {
    template: "**$**",
    icon: "format_bold",
    title: "Bold:",
    keyboardShortcut: "Ctrl-b"
  },
  italic: {
    template: "*$*",
    icon: "format_italic", title:
      "Italic:",
    keyboardShortcut: "Ctrl-i"
  },
  strike: {
    template: "~~$~~",
    icon: "strikethrough_s",
    title: "Strike:",
    keyboardShortcut: "Ctrl-s"
  },
  link: {
    template: (link: string, title?: string) => `[${title || link}](${link})$`,
    icon: "link",
    title: "Insert a link:",
    keyboardShortcut: "Ctrl-h"
  },
  list: {
    template: "\n+ $",
    icon: "list",
    title: "Bullet list:",
    keyboardShortcut: "Ctrl-l"
  },
  orderedList: {
    template: "\n1. $",
    icon: "format_list_numbered",
    title: "Numbered list:",
    keyboardShortcut: "Ctrl-o"
  },
  mark: {
    template: "==$==",
    icon: "border_color",
    title: "Highlight:",
    keyboardShortcut: "Ctrl-m"
  },
  hr: {
    template: "\n****$",
    icon: "horizontal_rule",
    title: "Horizontal row:",
    keyboardShortcut: "Ctrl-r"
  },
  image: {
    template: (link: string, title?: string) => `![${title || link}](${link})$`,
    icon: "image",
    title: "Insert an image:",
    keyboardShortcut: "Ctrl-p"
  },
}

export function getMarkdownDefinition(markdownName: string) {
  if (markdownsDefinitions[markdownName]) {
    return markdownsDefinitions[markdownName]
  }
  throw Error(`${markdownName} not found.`)
}

class KeyBoardShortcuts {
  MODIFIER_LETTER_SEPARATOR = "-"
  _keyboardShortcuts = new Map<string, string>()
  markdowns: MarkdownsDefinitions

  constructor(markdowns: MarkdownsDefinitions) {
    this.markdowns = markdowns
    this._build()
  }
  _build() {
    for (let markdownName in this.markdowns) {
      let [_, letter] = this.markdowns[markdownName]
        .keyboardShortcut.split(this.MODIFIER_LETTER_SEPARATOR)
      this._keyboardShortcuts.set(letter, markdownName)
    }
  }
  get(letter: string) {
    return this._keyboardShortcuts.get(letter)
  }
}

export const keyboardShortCuts = new KeyBoardShortcuts(markdownsDefinitions)