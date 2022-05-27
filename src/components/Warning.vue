<template>
  <div class="ui container small icon warning message yellow">
    <i class="delete icon"></i>
    <div class="ui container">
      {{ message }}
      <div class="ui right floated button" @click="$emit('No')">No</div>
      <div class="ui right floated button" @click="$emit('Yes')">Yes</div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    message: String
  }
}
</script>