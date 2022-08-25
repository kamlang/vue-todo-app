<template>
  <div class="wrapper">
    <form action="_blank">
      <span @click="handleDialogClose" class="material-symbols-outlined close-button">close</span>
      <label for="link">URL</label>
      <input
        ref="urlInput"
        data-test-id="urlDialog"
        type="text"
        v-model="link"
        id="link"
        name="link"
      />
      <label for="title">Title</label>
      <input data-test-id="titleDialog" type="text" v-model="title" id="title" name="title" />
      <div
        class="ui button selectButton"
        data-test-id="confirmDialog"
        @click="handleMarkdownSet"
      >Select</div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const link = ref("")
const title = ref("")
const urlInput = ref<HTMLInputElement>()
const emit = defineEmits(['markdown-set', 'close-dialog'])

onMounted(() => {
  if (urlInput.value) urlInput.value.focus()
})

function handleDialogClose() {
  emit('close-dialog')
}

function handleMarkdownSet() {
  emit('markdown-set', { link, title })
}
</script>

<style scoped>
.wrapper {
  display: flex;
  justify-content: space-around;
  align-items: center;
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: 1300;
  top: 0;
  left: 0;
  animation: fade 0.25s;
  background-color: rgb(0, 0, 0, 0.5);
}

form {
  border: 1px solid #e8e8e8;
  background-color: #ffffff;
  border-radius: 5px;
  padding: 1em;
  opacity: 1;
}
.close-button {
  float: right;
  font-size: 1em;
  top: -0.5em;
  left: 0.5em;
}

.close-button:hover {
  background-color: grey;
  border-radius: 50%;
  color: white;
  cursor: default;
}

input {
  display: block;
}

.selectButton {
  float: right;
  margin-top: 1em;
}

.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 48;
}
</style>