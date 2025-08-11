<template>
  <div class="flex w-full h-screen justify-center items-center">
    <div
      class="flex flex-row max-w-5xl p-5 bg-white shadow-lg inset-shadow-sm rounded-lg"
    >
      <div class="flex w-md max-h-3xl">
        <img
          src="/bussiness-card-image.webp"
          class="h-[600px] object-cover object-center"
          alt="Login Image Card"
        />
      </div>
      <div class="flex w-2xs items-center justify-center">
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4 w-full p-5 justify-center"
          :disabled="state.loading"
          @submit="onSubmit"
        >
          <UFormField label="Username" name="username" required>
            <UInput
              v-model="state.username"
              placeholder="Masukan Username"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Password" name="password" required>
            <UInput
              v-model="state.password"
              placeholder="Masukan Password"
              class="w-full"
              type="password"
            />
          </UFormField>
          <div class="flex">
            <UButton type="submit" class="mx-auto"> Submit </UButton>
          </div>
        </UForm>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";
interface Auth {
  message: string;
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
}

definePageMeta({
  middleware: ["auth"],
});

const schema = z.object({
  username: z.string().min(1, "Username tidak boleh kosong"),
  password: z.string().min(8, "Masukan Password Minimal 8 Karakter"),
});
type Schema = z.output<typeof schema>;

const state = reactive({
  username: "",
  password: "",
  loading: false,
});

const toast = useToast();
const auth = useAuthStore();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  const config = useRuntimeConfig();
  try {
    state.loading = true;
    const res = await $fetch<Auth>(`${config.public.apiUrl}/auth/login`, {
      method: "POST",
      body: { username: state.username, password: state.password },
      credentials: "include",
    });
    auth.login(res.user);
    toast.add({ title: `${res.message} ${res.user.name}`, color: "success" });
    await navigateTo("/");
  } catch (error) {
    state.loading = false;
    toast.add({ title: "Login Gagal", color: "error" });
    console.log(error);
  }
}
</script>

<style></style>
