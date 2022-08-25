<template>
  <div @keydown="handleKeyDown" class="markdown-area">
    <div data-test-id="markdownToolbar" class="markdown-area__toolbar">
      <MarkdownToolbarItem
        v-for="markdownName in Object.keys(markdowns)"
        :title="`${markdowns[markdownName].title} ${markdowns[markdownName].keyboardShortcut}`"
        :data-test-id="`markdown-${markdownName}`"
        :key="markdowns[markdownName].title"
        @click.prevent.stop="createMarkdown(markdownName)"
      >{{ markdowns[markdownName].icon }}</MarkdownToolbarItem>
    </div>
    <textarea
      :data-test-id="textAreaDataTestId"
      placeholder="Add a task..."
      rows="8"
      ref="textArea"
      v-model="markdownText"
    >{{ markdownText }}</textarea>

    <MarkdownLinkDialog
      v-if="showDialog"
      @keydown.esc="resetState"
      @close-dialog="resetState"
      @markdown-set="handleMarkdownSet"
    ></MarkdownLinkDialog>

    <div
      data-test-id="previewButton"
      class="ui segment"
      v-if="markdownText"
      @click="showPreview = !showPreview"
      tabindex="1"
    >
      <div v-if="showPreview">
        <i class="angle up icon"></i> Hide Preview
      </div>
      <div v-else>
        <i class="angle down icon"></i> Show Preview
      </div>
      <div
        v-if="markdownText && showPreview"
        data-test-id="previewBox"
        ref="previewBox"
        v-html="renderedMarkdownText"
        class="ui segment secondary taskelement"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, watchEffect } from 'vue'
import { useMarkdown } from "../composition/markdown/markdown"
import MarkdownToolbarItem from "./MarkdownToolbarItem.vue";
import MarkdownLinkDialog from "./MarkdownLinkDialog.vue"
import type { SelectedMarkdown, MarkdownName, Markdowns } from "../composition/markdown/types"

const { markdownText,
  renderedMarkdownText,
  insertMarkdownAt,
  wrapTextInMarkdown,
  markdowns
} = useMarkdown()

const emit = defineEmits(['taskBodySet'])
const props = defineProps({
  textAreaDataTestId: { type: String, required: true },
  taskBody: { type: String, required: false, default: "" }
})

watchEffect(() => {
  if (props.taskBody) {
    console.log(props.taskBody)
    markdownText.value = props.taskBody
  }
})

watch(markdownText, async () => {
  emit('taskBodySet', markdownText.value)
  if (await isPreviewBoxOverFlown() && previewBox.value) {
    previewBox.value.scrollTop += 50
  }
})

const textArea = ref<HTMLTextAreaElement>()
const showDialog = ref(false)
const showPreview = ref(false)
const previewBox = ref<HTMLDivElement>()
const selectedMarkdown = ref<SelectedMarkdown>()

class KeyBoardShortcutMap {
  // keyboard shortcut are defined as ctrl-k.
  _modifierLetterSeparator = "-"
  shortcutKeyName = new Map<string, string>()
  markdowns: Markdowns

  constructor(markdowns: Markdowns) {
    this.markdowns = markdowns
    this._build()
  }
  _build() {
    for (let markdownName in this.markdowns) {
      let [_, letter] = this.markdowns[markdownName]
        .keyboardShortcut.split(this._modifierLetterSeparator)
      this.shortcutKeyName.set(letter, markdownName)
    }
  }
  get(letter: string) {
    return this.shortcutKeyName.get(letter)
  }
}

const kbm = new KeyBoardShortcutMap(markdowns.value)

function handleKeyDown(event: KeyboardEvent) {
  if (event.key && event.ctrlKey) {
    let markdownName = kbm.get(event.key)
    if (markdownName) {
      event.preventDefault()
      createMarkdown(markdownName)
    }
  }
}

async function createMarkdown(markdownName: MarkdownName) {
  let newCursorPosition
  const selectionLength = await getSelectionLength() as number
  const cursorPosition = await getCursorPosition() as number
  if (markdownName === 'link' || markdownName === 'image') {
    const URLHasBeenDefined = selectedMarkdown.value?.link
    if (URLHasBeenDefined && selectedMarkdown.value) {
      newCursorPosition = insertMarkdownAt(selectedMarkdown.value, cursorPosition)
    } else {
      showDialog.value = !showDialog.value
      selectedMarkdown.value = { name: markdownName }
      selectedMarkdown.value.cursorPosition = cursorPosition
      return
    }
  } else if (selectionLength === 0) {
    selectedMarkdown.value = { name: markdownName }
    newCursorPosition = insertMarkdownAt(selectedMarkdown.value, cursorPosition)
  } else {
    selectedMarkdown.value = { name: markdownName }
    newCursorPosition = wrapTextInMarkdown(selectedMarkdown.value, cursorPosition,
      selectionLength)
  }
  resetState()
  await setCursorPosition(newCursorPosition)
}

async function getSelectionLength() {
  await nextTick()
  if (textArea.value) {
    return Math.abs(textArea.value.selectionStart - textArea.value.selectionEnd)
  }
}

async function getCursorPosition() {
  await nextTick()
  return textArea.value?.selectionStart
}

async function setCursorPosition(cursorPosition: number) {
  await nextTick()
  if (textArea.value) {
    textArea.value.focus()
    textArea.value.selectionStart = cursorPosition
    textArea.value.selectionEnd = cursorPosition
  }
}

function resetState() {
  showDialog.value = false
  selectedMarkdown.value = {}
}

async function handleMarkdownSet(options: any) {
  let { link, title } = options
  if (selectedMarkdown.value) {
    selectedMarkdown.value.link = link
    selectedMarkdown.value.title = title
    if (selectedMarkdown.value.name) {
      createMarkdown(selectedMarkdown.value.name)
    }
  }
}

async function isPreviewBoxOverFlown() {
  await nextTick()
  if (previewBox.value) {
    return previewBox.value?.scrollHeight > previewBox.value?.clientHeight
  }
}

</script>

<style scoped>
.markdown-area {
  display: flex;
  flex: auto;
  flex-direction: column;
  gap: 0.5em;
  margin: 0;
}
.markdown-area__preview {
  border: 1px solid #ececec;
  max-height: 10em;
  overflow: auto;
  border-radius: 5px;
  padding: 0.5em;
}

textarea {
  resize: vertical;
}
.markdown-area__toolbar {
  margin-bottom: 0.5em;
}
.markdown-area__toolbar button:first-child {
  border-radius: 5px 0 0 5px;
}

.markdown-area__toolbar button:last-child {
  border-radius: 0 5px 5px 0;
}
</style>
