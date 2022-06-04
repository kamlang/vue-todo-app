<script>
export default {
  emits: ['yes', 'no'],
  props: {
    message: String
  }
}
</script>

<template>
  <div class="ui fluid container small icon warning message yellow">
    <i class="delete icon"></i>
    <div class="ui container">
      {{ message }}
      <div
        data-test-id="warnNo"
        tabindex="0"
        class="ui right floated button"
        @keydown.enter="$emit('no')"
        @click="$emit('no')"
      >No</div>
      <div
        data-test-id="warnYes"
        tabindex="0"
        class="ui right floated button"
        @keydown.enter="$emit('yes')"
        @click="$emit('yes')"
      >Yes</div>
    </div>
  </div>
</template>
<style scoped>
.warning.message {
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}
</style>