<template>
  <a v-if="!user" class="item" @click="login">
    <i class="sign-in icon"></i>Login
  </a>
</template>

<script>
export default {
  data: function () {
    return {
      user: this.$auth0.user,
      //        idTokenClaims: this.$auth0.idTokenClaims,
    };
  },
  methods: {
    login() {
      this.$auth0.loginWithRedirect();
    },
  }
}
</script>