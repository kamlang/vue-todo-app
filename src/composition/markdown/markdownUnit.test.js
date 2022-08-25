import { useMarkdown } from "./markdown"
import { describe, it, expect } from "vitest";
describe("Testing useMarkdown composition function", () => {
  it("test rendering of markdown", () => {
    // Test for other markdowns.
    const { markdownText,
      renderedMarkdownText,
      markdowns
    } = useMarkdown()
    markdownText.value = "**Arf**"
    expect(renderedMarkdownText.value).toContain("<p><strong>Arf</strong></p>")

    markdownText.value = "*Arf*"
    expect(renderedMarkdownText.value).toContain("<p><em>Arf</em></p>")

  })
  it("testing insert markdown at.", () => {
    const { markdownText,
      insertMarkdownAt,
    } = useMarkdown()

    markdownText.value = "0123456"
    let newPosition = insertMarkdownAt({ name: "bold" }, 2)
    expect(newPosition).toBe(4)
    expect(markdownText.value).toBe("01****23456")

    markdownText.value = "0123456"
    newPosition = insertMarkdownAt({ name: "strike" }, 2)
    expect(newPosition).toBe(4)
    expect(markdownText.value).toBe("01~~~~23456")

  })

  it("testing insert markdown at.", () => {
    const { markdownText,
      wrapTextInMarkdown,
    } = useMarkdown()

    markdownText.value = "0123456"
    let newPosition = wrapTextInMarkdown({ name: "bold" }, 2, 2)
    expect(newPosition).toBe(8)
    expect(markdownText.value).toBe("01**23**456")

    markdownText.value = "0123456"
    newPosition = wrapTextInMarkdown({ name: "strike" }, 2, 2)
    expect(newPosition).toBe(8)
    expect(markdownText.value).toBe("01~~23~~456")

  })
})