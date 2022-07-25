<script>
import FadeTransition from "./FadeTransition.vue"
export default {
  emits: ['markTaskAsCompleted', 'dismissTaskReminder'],
  components: { FadeTransition },
  props: {
    task: Object
  }
}
</script>

<template>
  <FadeTransition>
    <div class="ui fluid container small icon teal message">
      <div class="ui container">
        <div data-test-id="notification-container" class="flex-container content">
          <i class="tasks icon"></i>
          <b>{{ task.projectName }}:</b>
          <br />
          <q>
            <i>{{ task.body }}</i>
          </q>
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
</style>