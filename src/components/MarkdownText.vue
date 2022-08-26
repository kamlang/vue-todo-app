<template>
  <div @keydown="handleKeyDown" class="markdown-area">
    <div data-test-id="markdownToolbar" class="markdown-area__toolbar">
      <MarkdownToolbarItem
        v-for="markdownName in usedMarkdownsNames"
        :title="`${getMarkdownDefinition(markdownName).title} ${getMarkdownDefinition(markdownName).keyboardShortcut}`"
        :data-test-id="`markdown-${markdownName}`"
        :key="getMarkdownDefinition(markdownName).title"
        @click.prevent.stop="createMarkdown(markdownName)"
      >{{ getMarkdownDefinition(markdownName).icon }}</MarkdownToolbarItem>
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
import { useMarkdown } from "../composition/markdown/useMarkdown"
import MarkdownToolbarItem from "./MarkdownToolbarItem.vue";
import MarkdownLinkDialog from "./MarkdownLinkDialog.vue"
import { keyboardShortCuts, getMarkdownDefinition } from '../composition/markdown/markdown-definition'
import type { MarkdownProps, MarkdownName, } from "../composition/markdown/types"

const { markdownText,
  renderedMarkdownText,
  insertMarkdownAndGetCursorPosition,
  wrapTextInMarkdownAndGetCursorPosition,
} = useMarkdown()

const emit = defineEmits(['taskBodySet'])
const props = defineProps({
  textAreaDataTestId: { type: String, required: true },
  taskBody: { type: String, required: false, default: "" }
})

watchEffect(() => {
  if (props.taskBody) {
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
const selectedMarkdownProps = ref<MarkdownProps>()
const usedMarkdownsNames = ["bold", "italic", "strike", "link", "list", "orderedList", "mark", "hr"]


function handleKeyDown(event: KeyboardEvent) {
  if (event.key && event.ctrlKey) {
    let markdownName = keyboardShortCuts.get(event.key)
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
    const URLHasBeenDefined = selectedMarkdownProps.value?.link
    if (URLHasBeenDefined && selectedMarkdownProps.value) {
      newCursorPosition = insertMarkdownAndGetCursorPosition(selectedMarkdownProps.value, cursorPosition)
    } else {
      showDialog.value = !showDialog.value
      selectedMarkdownProps.value = { name: markdownName }
      selectedMarkdownProps.value.cursorPosition = cursorPosition
      return
    }
  } else if (selectionLength === 0) {
    selectedMarkdownProps.value = { name: markdownName }
    newCursorPosition = insertMarkdownAndGetCursorPosition(selectedMarkdownProps.value, cursorPosition)
  } else {
    selectedMarkdownProps.value = { name: markdownName }
    newCursorPosition = wrapTextInMarkdownAndGetCursorPosition(selectedMarkdownProps.value, cursorPosition,
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
  selectedMarkdownProps.value = {}
}

async function handleMarkdownSet(options: any) {
  let { link, title } = options
  if (selectedMarkdownProps.value) {
    selectedMarkdownProps.value.link = link
    selectedMarkdownProps.value.title = title
    if (selectedMarkdownProps.value.name) {
      createMarkdown(selectedMarkdownProps.value.name)
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
