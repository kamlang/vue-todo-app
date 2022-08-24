/* Icons name refers to: https://fonts.google.com/icons?icon.style=Outlined
 * "$" sign use as a place holder to insert text or position cursor.
 */
import type { Markdowns } from "./types"
export const markdownsDefinition: Markdowns = {
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
}
/*
image: {
  template: (link: string, title?: string) => `![${title || link}](${link})$`,
  icon: "image",
  title: "Insert an image:",
  keyboardShortcut: "Ctrl-p"
},*/