/* Icons name refers to: https://fonts.google.com/icons?icon.style=Outlined
 * "$" sign use as a place holder to insert text or position cursor.
 */

const _markdownsDefinitions = {
  bold: {
    template: "**$**",
    icon: "format_bold",
    title: "Bold:",
    keyboardShortcut: "b"
  },
  italic: {
    template: "*$*",
    icon: "format_italic", title:
      "Italic:",
    keyboardShortcut: "i"
  },
  strike: {
    template: "~~$~~",
    icon: "strikethrough_s",
    title: "Strike:",
    keyboardShortcut: "s"
  },
  link: {
    template: (link: string, title?: string) => `[${title || link}](${link})$`,
    icon: "link",
    title: "Insert a link:",
    keyboardShortcut: "h"
  },
  list: {
    template: "\n+ $",
    icon: "list",
    title: "Bullet list:",
    keyboardShortcut: "l"
  },
  orderedList: {
    template: "\n1. $",
    icon: "format_list_numbered",
    title: "Numbered list:",
    keyboardShortcut: "o"
  },
  mark: {
    template: "==$==",
    icon: "border_color",
    title: "Highlight:",
    keyboardShortcut: "m"
  },
  hr: {
    template: "\n****\n$",
    icon: "horizontal_rule",
    title: "Horizontal row:",
    keyboardShortcut: "r"
  },
  image: {
    template: (link: string, title?: string) => `![${title || link}](${link})$`,
    icon: "image",
    title: "Insert an image:",
    keyboardShortcut: "p"
  },
}

export function getMarkdown(markdownName: string) {
  if (_markdownsDefinitions[markdownName]) {
    return _markdownsDefinitions[markdownName]
  }
  throw new Error(`${markdownName} not found.`)
}

export const markdownsWithATemplateFunction = Object.entries(_markdownsDefinitions)
  .filter(markdownDefinition => {
    let [_, markdown] = markdownDefinition
    return typeof markdown.template === 'function'
  }).map(markdownDefinition => {
    let [markdownName, _] = markdownDefinition
    return markdownName
  })


export const keyboardShortcuts = new Map<string, string>(
  Object.entries(_markdownsDefinitions)
    .map(markdownDefinition => {
      let [markdownName, markdown] = markdownDefinition
      return [markdown.keyboardShortcut, markdownName]
    })
)