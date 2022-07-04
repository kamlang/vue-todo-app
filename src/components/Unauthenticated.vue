<template>
  <FadeTransition>
    <div class="ui center aligned message">
      <div class="content">
        <div class="header">You must be logged in !</div>
        <p>You can login or sign-up using the button above.</p>
      </div>
    </div>
  </FadeTransition>
</template>
<script>

import FadeTransition from './FadeTransition.vue'
export default {
  components: {
    FadeTransition
  },
}
</script>
<style scoped>
.message {
  max-width: 960px;
  margin: auto;
}
</style>
