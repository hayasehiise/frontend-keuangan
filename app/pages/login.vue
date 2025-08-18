<template>
  <div class="flex w-full h-screen justify-center items-center">
    <div
      class="flex flex-row max-w-5xl p-5 bg-white shadow-lg inset-shadow-sm rounded-lg"
    >
      <div class="flex w-xs items-center justify-center">
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
  password: z.string().min(6, "Masukan Password Minimal 6 Karakter"),
});
type Schema = z.output<typeof schema>;

const state = reactive({
  username: "",
  password: "",
  loading: false,
});

const toast = useToast();
const auth = useAuthStore();
async function onSubmit(_event: FormSubmitEvent<Schema>) {
  try {
    state.loading = true;
    const res = await useApiFetchInput<Auth>("/auth/login", {
      method: "POST",
      body: { username: state.username, password: state.password },
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
