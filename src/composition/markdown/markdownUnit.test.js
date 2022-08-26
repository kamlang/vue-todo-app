import { useMarkdown } from "./useMarkdown"
import { describe, it, expect } from "vitest";
describe("Testing useMarkdown composition function", () => {
  it("test rendering of markdown", () => {
    // Test for other markdowns.
    const { markdownText,
      renderedMarkdownText,
    } = useMarkdown()
    markdownText.value = "**Arf**"
    expect(renderedMarkdownText.value).toContain("<p><strong>Arf</strong></p>")

    markdownText.value = "*Arf*"
    expect(renderedMarkdownText.value).toContain("<p><em>Arf</em></p>")

  })
  it("testing insert markdown at.", () => {
    const { markdownText,
      insertMarkdownAndGetCursorPosition,
    } = useMarkdown()

    markdownText.value = "0123456"
    let newPosition = insertMarkdownAndGetCursorPosition({ name: "bold" }, 2)
    expect(newPosition).toBe(4)
    expect(markdownText.value).toBe("01****23456")

    markdownText.value = "0123456"
    newPosition = insertMarkdownAndGetCursorPosition({ name: "strike" }, 2)
    expect(newPosition).toBe(4)
    expect(markdownText.value).toBe("01~~~~23456")

  })

  it("testing insert markdown at.", () => {
    const { markdownText,
      wrapTextInMarkdownAndGetCursorPosition,
    } = useMarkdown()

    markdownText.value = "0123456"
    let newPosition = wrapTextInMarkdownAndGetCursorPosition({ name: "bold" }, 2, 2)
    expect(newPosition).toBe(8)
    expect(markdownText.value).toBe("01**23**456")

    markdownText.value = "0123456"
    newPosition = wrapTextInMarkdownAndGetCursorPosition({ name: "strike" }, 2, 2)
    expect(newPosition).toBe(8)
    expect(markdownText.value).toBe("01~~23~~456")

  })
})