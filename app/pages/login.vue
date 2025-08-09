<template>
  <div>
    <h1>Login Page</h1>
    <br />
    <form @submit.prevent="submitLogin">
      <input v-model="state.username" placeholder="Username" />
      <input v-model="state.password" type="password" placeholder="Password" />
      <button type="submit" :disabled="state.loading">Login</button>
      <p v-if="state.error">{{ state.error }}</p>
    </form>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: ["auth"],
});

// const auth = useAuthStore();
const state = reactive({
  username: "",
  password: "",
  loading: false,
  error: "",
});

async function submitLogin() {
  const auth = useAuthStore();
  try {
    const config = useRuntimeConfig();
    const res = await $fetch(`${config.public.apiUrl}/auth/login`, {
      method: "POST",
      body: { username: state.username, password: state.password },
      credentials: "include",
    });
    if (res) {
      state.loading = true;
      auth.isLoggedin = true;
      await navigateTo("/");
    }
  } catch (err) {
    console.log(err);
    state.error = "Login gagal";
    state.loading = false;
  }
}
</script>

<style></style>
