<template>
  <FadeTransition>
    <div class="ui icon message">
      <i class="notched circle loading icon"></i>
      <div class="content">
        <div class="header">Just one second</div>
        <p>We're fetching that content for you.</p>
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
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}
</style>

