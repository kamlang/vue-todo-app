

<template>
  <FadeTransition>
    <div class="ui fluid container small icon teal message">
      <div class="ui container">
        <div data-test-id="notification-container" class="flex-container content">
          <i class="tasks icon"></i>
          <b>{{ task.projectName }}:</b>
          <div class="task-body" v-html="renderedMarkdownText"></div>
        </div>
        <div class="flex-container buttons">
          <div
            data-test-id="notification-markascompleted"
            tabindex="0"
            class="ui right floated button"
            @keydown.enter="$emit('markTaskAsCompleted')"
            @click="$emit('markTaskAsCompleted')"
            @touchstart.prevent="$emit('markTaskAsCompleted')"
          >Mark as completed</div>
          <div
            data-test-id="notification-dismiss"
            tabindex="0"
            class="ui right floated button"
            @keydown.enter="$emit('dismissTaskReminder')"
            @click="$emit('dismissTaskReminder')"
            @touchstart.prevent="$emit('dismissTaskReminder')"
          >Dismiss</div>
        </div>
      </div>
    </div>
  </FadeTransition>
</template>

<script setup lang=ts>
import { useMarkdown } from "../composition/markdown/useMarkdown";
import FadeTransition from "./FadeTransition.vue"
import { onMounted } from 'vue'

const { markdownText, renderedMarkdownText } = useMarkdown()
const emit = defineEmits(['markTaskAsCompleted', 'dismissTaskReminder'])
const props = defineProps({
  task: { type: Object, required: true }
})

onMounted(() => {
  markdownText.value = props.task.body
})

</script>
<style>
.task-body * {
  margin: 0 !important;
}
</style>
<style scoped>
.flex-container.buttons {
  display: flex;
  flex: 1 0 auto;
  align-items: center;
  justify-content: flex-end;
}
.flex-container.content {
  flex: auto;
}
.ui.container {
  display: flex;
  flex-flow: row;
  flex: auto;
  gap: 1rem;
}

@media screen and (max-width: 600px) {
  .ui.container {
    flex-flow: row wrap;
  }
  .flex-container.buttons {
    justify-content: center;
  }
}
.task-body {
  padding-left: 1em;
  font-style: italic;
}
</style>