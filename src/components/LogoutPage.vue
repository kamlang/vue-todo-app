<template>
  <a v-if="user" class="item" @click="logout">
 <i class="sign-out icon"></i></a>
</template>

<script>
  export default {
    data () {
      return {
        user: this.$auth0.user,
      }
    },
    methods: {
      logout() {
        this.$auth0.logout({ returnTo: window.location.origin });
      }
    }
  };
</script>