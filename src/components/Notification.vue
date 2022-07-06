<script>
export default {
  emits: ['markTaskAsCompleted', 'dismissTaskReminder'],
  props: {
    task: Object
  }
}
</script>

<template>
  <div class="ui fluid container small icon teal message">
    <div class="ui container">
      <div data-test-id="notification-container" class="flex-container content">
        <i class="tasks icon"></i>
        <b>{{ task.taskListName }}:</b>
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
          @keydown.enter="$emit('markTaskAsCompleted', task)"
          @click="$emit('markTaskAsCompleted', task)"
          @touchstart.prevent="$emit('markTaskAsCompleted', task)"
        >Mark as completed</div>
        <div
          data-test-id="notification-dismiss"
          tabindex="0"
          class="ui right floated button"
          @keydown.enter="$emit('dismissTaskReminder', task)"
          @click="$emit('dismissTaskReminder', task)"
          @touchstart.prevent="$emit('dismissTaskReminder', task)"
        >Dismiss</div>
      </div>
    </div>
  </div>
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
.message {
  width: 700px;
  margin-left: auto;
  margin-right: auto;
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