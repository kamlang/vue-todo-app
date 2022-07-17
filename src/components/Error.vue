<template>
  <div data-test-id="errorMessage" class="ui fluid container small icon negative message">
    <i class="delete icon"></i>
    <i data-test-id="errorMessageClose" class="close icon" @click="$emit('closed')"></i>
    <div class="ui container">{{ errorMessage }}</div>
  </div>
</template>

<script>
export default {
  emits: ['closed'],
  props: {
    errorMessage: String
  },
}
</script>