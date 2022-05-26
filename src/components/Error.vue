<template>
  <div v-if="errorMessage" class="ui text container tiny icon negative message">
    <i class="delete icon"></i>
    <i class="close icon" @click="$emit('closed')"></i>
    <div class="ui text container">{{ errorMessage }}</div>
  </div>
</template>

<script>
export default {
  emits: {
    closed() {
      console.log("test")
    }
  },
  props: {
    errorMessage: String
  },
}

</script>