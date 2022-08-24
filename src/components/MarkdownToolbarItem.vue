<template>
  <button class="material-symbols-outlined">
    <slot></slot>
  </button>
</template>


<style scoped>
button {
  color: grey;
  padding: 0.3em;
  border-radius: 0px;
  border-width: 0px;
}

.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20;
}
</style>

