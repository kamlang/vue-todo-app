<template>
  <a v-if="isAuthenticated" class="item" @click="logout">
    <i class="sign out alternate icon"></i>
    <span class="collapsable">Log out</span>
  </a>

  <a v-else class="item" @click="login">
    <i class="sign in alternate icon"></i>
    <span class="collapsable">Log in / Sign up</span>
  </a>
</template>

<script>
export default {
  data: function () {
    return {
      isAuthenticated: this.$auth0.isAuthenticated
    };
  },
  methods: {
    login() {
      this.$auth0.loginWithRedirect();
    },
    logout() {
      this.$auth0.logout({ returnTo: window.location.origin });
    }
  },
}
</script>