<script lang="ts" setup>
import type { TableColumn, FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";
import { h, resolveComponent } from "vue";

definePageMeta({
  middleware: ["auth"],
  title: "User Management",
  meta: [
    {
      name: "description",
      content: "Halaman untuk mengelola daftar user yang tersedia.",
    },
  ],
});

// type for User data
type User = {
  id: string;
  name: string;
  username: string;
  role: string;
  toko?: {
    id: string;
    nama: string;
  };
  createdAt: string;
};
type UserResponse = {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

// Parameters for pagination and search
const params = ref({
  page: 1,
  limit: 10,
  search: "",
});

//query for pagination and search
const query = computed(() => ({
  page: params.value.page,
  limit: params.value.limit,
  ...(params.value.search ? { search: params.value.search } : {}),
}));

// Fetch user data with pagination and search
const {
  data: response,
  pending,
  refresh: userRefresh,
} = await useApiFetch<UserResponse>("/user", {
  method: "GET",
  query,
});

// Import components
const UButton = resolveComponent("UButton");

// computed User, total, and column for the table
const user = computed<User[]>(() => response.value?.data || []);
const total = computed(() => response.value?.total ?? 0);
const column: TableColumn<User>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) =>
      (params.value.page - 1) * params.value.limit + row.index + 1,
  },
  {
    accessorKey: "name",
    header: "Nama User",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "role",
    header: "Role User",
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat Tanggal",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    },
  },
  {
    accessorKey: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      return h("div", { class: "flex gap-2" }, [
        h(UButton, {
          icon: "i-lucide-edit",
          color: "primary",
          onClick: () => openUpdateUserModal(row.original),
        }),
        h(UButton, {
          icon: "i-lucide-trash",
          color: "error",
          onClick: () => openDeleteUserModal(row.original),
        }),
      ]);
    },
  },
];

// Type data Toko
type Toko = {
  id: string;
  nama: string;
  createdAt: string;
};
type TokoResponse = Toko[];

// Fetch data Toko untuk dropdown
const { data: tokoResponse, pending: tokoPending } =
  await useApiFetch<TokoResponse>("/toko/list", {
    method: "GET",
  });

// Computed untuk options dropdown toko
const tokoOptions = computed(() => {
  if (!tokoResponse.value || !Array.isArray(tokoResponse.value)) {
    return [];
  }
  return tokoResponse.value.map((toko) => ({
    label: toko.nama,
    value: toko.id,
  }));
});

// Modal State and Form State
const addUserModal = ref(false);
const updateUserModal = ref(false);
const deleteUserModal = ref(false);
const isSubmitting = ref(false);
const isUpdating = ref(false);
const isDeleting = ref(false);

// Form reference for validation
const formRef = ref();
const updateFormRef = ref();

// selected user for update or delete
const selectedUser = ref<User | null>(null);

// Import toast composable
const toast = useToast();

// form schema untuk validasi
const createDynamicSchema = (role: string) => {
  const baseSchema = {
    name: z.string().min(1, "Nama tidak boleh kosong"),
    username: z.string().min(1, "Username tidak boleh kosong"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    role: z.enum(["ADMIN", "OWNER", "KASIR"], "Pilih role yang valid"),
  };
  if (role === "ADMIN") {
    return z.object({
      ...baseSchema,
      tokoId: z.string().optional(),
    });
  } else {
    return z.object({
      ...baseSchema,
      tokoId: z.string().min(1, "Toko tidak boleh kosong"),
    });
  }
};

// Define explicit type untuk form state
type Schema = {
  name: string;
  username: string;
  password: string;
  role: "ADMIN" | "OWNER" | "KASIR";
  tokoId?: string;
};

const schema = computed(() => createDynamicSchema(formState.role || "ADMIN"));

// schema untuk update user
const createUpdateDynamicSchema = (role: string) => {
  const baseSchema = {
    name: z.string().min(1, "Nama tidak boleh kosong"),
    username: z.string().min(1, "Username tidak boleh kosong"),
    password: z.string().optional(),
    role: z.enum(["ADMIN", "OWNER", "KASIR"], "Pilih role yang valid"),
  };
  if (role === "ADMIN") {
    return z.object({
      ...baseSchema,
      tokoId: z.string().optional(),
    });
  } else {
    return z.object({
      ...baseSchema,
      tokoId: z.string().min(1, "Toko tidak boleh kosong"),
    });
  }
};
// Define explicit type untuk update form state
type UpdateSchema = {
  name: string;
  username: string;
  password?: string;
  role: "ADMIN" | "OWNER" | "KASIR";
  tokoId?: string;
};

const updateSchema = computed(() =>
  createUpdateDynamicSchema(updateFormState.role || "ADMIN")
);

// Reactive state untuk form
const formState = reactive<Schema>({
  name: "",
  username: "",
  password: "",
  role: "ADMIN",
  tokoId: "",
});

// Reactive state untuk update form
const updateFormState = reactive<UpdateSchema>({
  name: "",
  username: "",
  password: "",
  role: "ADMIN",
  tokoId: "",
});

// Role options untuk dropdown
const roleOptions = ref([
  { label: "Admin", value: "ADMIN" },
  { label: "Owner", value: "OWNER" },
  { label: "Kasir", value: "KASIR" },
]);

//Computed untuk mengecek apakah toko required berdasarkan role
const isTokoRequired = computed(() => {
  return formState.role !== "ADMIN";
});
const isTokoRequiredForUpdate = computed(() => {
  return updateFormState.role !== "ADMIN";
});

// watcher untuk reset tokoId jika role berubah
watch(
  () => formState.role,
  (newRole) => {
    if (newRole === "ADMIN") {
      formState.tokoId = "";
    }
  }
);
watch(
  () => updateFormState.role,
  (newRole) => {
    if (newRole === "ADMIN") {
      updateFormState.tokoId = "";
    }
  }
);

// Form Submit Handler
async function onSubmit(event: FormSubmitEvent<Schema>) {
  event.preventDefault();
  isSubmitting.value = true;

  try {
    // await schema.parseAsync(formState);
    await schema.value.parseAsync(formState);
    // Siapkan Data untuk submit
    const submitData = { ...formState };
    if (formState.role === "ADMIN" && !submitData.tokoId) {
      delete submitData.tokoId; // Hapus tokoId jika role adalah ADMIN
    }
    // Simulate API call
    await useApiFetchInput("/user", {
      method: "POST",
      body: submitData,
    });
    toast.add({
      title: "User berhasil dibuat",
      color: "success",
    });
    addUserModal.value = false;
    // Reset form state
    Object.assign(formState, {
      name: "",
      username: "",
      password: "",
      role: "ADMIN",
      tokoId: "",
    });

    await userRefresh(); // Refresh user list after adding new user
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err) =>
        toast.add({
          title: err.message,
          color: "error",
        })
      );
    } else {
      toast.add({
        title: "Terjadi kesalahan saat membuat user",
        color: "error",
      });
    }
  } finally {
    isSubmitting.value = false;
  }
}

// Update form submit handler
async function onUpdateSubmit(event: FormSubmitEvent<UpdateSchema>) {
  event.preventDefault();
  isUpdating.value = true;

  try {
    // await updateSchema.parseAsync(updateFormState);
    await updateSchema.value.parseAsync(updateFormState);
    // siapkan data untuk update
    const updateData = { ...updateFormState };
    if (updateFormState.role === "ADMIN" && !updateData.tokoId) {
      delete updateData.tokoId; // Hapus tokoId jika role adalah ADMIN
    }
    // Siapkan Data untuk update (hapus password jika tidak diisi)
    if (!updateData.password) {
      delete updateData.password;
    }
    // Simulate API call
    await useApiFetchInput(`/user/${selectedUser.value?.id}`, {
      method: "PUT",
      body: updateData,
    });
    toast.add({
      title: "User berhasil diperbarui",
      color: "success",
    });
    updateUserModal.value = false;
    selectedUser.value = null; // Reset selected user
    // Reset form state
    Object.assign(updateFormState, {
      name: "",
      username: "",
      password: "",
      role: "ADMIN",
      tokoId: "",
    });

    await userRefresh(); // Refresh user list after updating user
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err) =>
        toast.add({
          title: err.message,
          color: "error",
        })
      );
    } else {
      toast.add({
        title: "Terjadi kesalahan saat memperbarui user",
        color: "error",
      });
    }
  } finally {
    isUpdating.value = false;
  }
}

// Delete user handler
async function onDeleteUser() {
  if (!selectedUser.value) return;

  isDeleting.value = true;

  try {
    // Simulate API call
    await useApiFetchInput(`/user/${selectedUser.value.id}`, {
      method: "DELETE",
    });
    toast.add({
      title: "User berhasil dihapus",
      color: "success",
    });
    deleteUserModal.value = false;
    selectedUser.value = null; // Reset selected user

    await userRefresh(); // Refresh user list after deleting user
  } catch (error) {
    console.error(error);
    toast.add({
      title: "Terjadi kesalahan saat menghapus user",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
}

// Function untuk submit form dari footer modal
async function submitForm() {
  if (formRef.value) {
    await formRef.value.submit();
  }
}
// Function untuk submit update form dari footer modal
async function submitUpdateForm() {
  if (updateFormRef.value) {
    await updateFormRef.value.submit();
  }
}

// function untuk membuka modal
function openAddUserModal() {
  addUserModal.value = true;
}

// function untuk membuka delete modal
function openDeleteUserModal(user: User) {
  selectedUser.value = user;
  deleteUserModal.value = true;
}

// function untuk membuka update modal
function openUpdateUserModal(user: User) {
  selectedUser.value = user;
  updateFormState.name = user.name;
  updateFormState.username = user.username;
  updateFormState.role = user.role as "ADMIN" | "OWNER" | "KASIR";
  updateFormState.tokoId = user.toko?.id || ""; // Assuming toko_id is part of User
  updateUserModal.value = true;
}

// function untuk menutup modal dan reset form
function closeAddUserModal() {
  addUserModal.value = false;
  Object.assign(formState, {
    name: "",
    username: "",
    password: "",
    role: "ADMIN",
    tokoId: "",
  });
}

// function untuk menutup update modal dan reset form
function closeUpdateUserModal() {
  updateUserModal.value = false;
  selectedUser.value = null; // Reset selected user
  Object.assign(updateFormState, {
    name: "",
    username: "",
    password: "",
    role: "ADMIN",
    tokoId: "",
  });
}

// function untuk menutup delete modal
function closeDeleteUserModal() {
  deleteUserModal.value = false;
  selectedUser.value = null; // Reset selected user
}
</script>

<template>
  <UContainer>
    <h1 class="text-2xl font-bold mb-4">User List</h1>
    <div class="flex flex-row gap-4">
      <UInput v-model="params.search" placeholder="Cari user" class="w-64" />
      <UButton
        icon="i-lucide-circle-plus"
        label="Tambah User"
        color="primary"
        @click="openAddUserModal"
      />

      <!-- modal Add user -->
      <UModal
        v-model:open="addUserModal"
        :ui="{ footer: 'justify-end', body: 'p-6' }"
      >
        <template #header>
          <h2 class="text-lg font-semibold">Tambah User Baru</h2>
        </template>
        <template #body>
          <UForm
            ref="formRef"
            :schema="schema"
            :state="formState"
            class="space-y-4"
            @submit="onSubmit"
          >
            <UFormField label="Nama" name="name" required>
              <UInput
                v-model="formState.name"
                placeholder="Masukan Nama"
                class="w-full"
                :disabled="isSubmitting"
              />
            </UFormField>
            <UFormField label="Username" name="username" required>
              <UInput
                v-model="formState.username"
                placeholder="Masukan Username"
                class="w-full"
                :disabled="isSubmitting"
              />
            </UFormField>
            <UFormField label="Password" name="password" required>
              <UInput
                v-model="formState.password"
                placeholder="Masukan Password"
                class="w-full"
                type="password"
                :disabled="isSubmitting"
              />
            </UFormField>
            <UFormField label="Role" name="role" required>
              <USelect
                v-model="formState.role"
                :items="roleOptions"
                placeholder="Pilih Role"
                class="w-full"
                :disabled="isSubmitting"
              />
            </UFormField>
            <UFormField label="Toko" name="tokoId" :required="isTokoRequired">
              <USelect
                v-model="formState.tokoId"
                :items="tokoOptions"
                placeholder="Pilih Toko"
                class="w-full"
                :disabled="isSubmitting"
                :loading="tokoPending"
              />
            </UFormField>
          </UForm>
        </template>
        <template #footer>
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            :disabled="isSubmitting"
            @click="closeAddUserModal"
          />
          <UButton
            label="Submit"
            color="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="submitForm"
          />
        </template>
      </UModal>

      <!-- modal Update user -->
      <UModal
        v-model:open="updateUserModal"
        :ui="{ footer: 'justify-end', body: 'p-6' }"
      >
        <template #header>
          <h2 class="text-lg font-semibold">Update User</h2>
        </template>
        <template #body>
          <UForm
            ref="updateFormRef"
            :schema="updateSchema"
            :state="updateFormState"
            class="space-y-4"
            @submit="onUpdateSubmit"
          >
            <UFormField label="Nama" name="name" required>
              <UInput
                v-model="updateFormState.name"
                placeholder="Masukan Nama"
                class="w-full"
                :disabled="isUpdating"
              />
            </UFormField>
            <UFormField label="Username" name="username" required>
              <UInput
                v-model="updateFormState.username"
                placeholder="Masukan Username"
                class="w-full"
                :disabled="isUpdating"
              />
            </UFormField>
            <UFormField label="Password" name="password">
              <UInput
                v-model="updateFormState.password"
                placeholder="Masukan Password (Kosongkan jika tidak ingin mengubah)"
                class="w-full"
                type="password"
                :disabled="isUpdating"
              />
            </UFormField>
            <UFormField label="Role" name="role" required>
              <USelect
                v-model="updateFormState.role"
                :items="roleOptions"
                placeholder="Pilih Role"
                class="w-full"
                :disabled="isUpdating"
              />
            </UFormField>
            <UFormField
              label="Toko"
              name="tokoId"
              :required="isTokoRequiredForUpdate"
            >
              <USelect
                v-model="updateFormState.tokoId"
                :items="tokoOptions"
                placeholder="Pilih Toko"
                class="w-full"
                :disabled="isUpdating || tokoPending"
              />
            </UFormField>
          </UForm>
        </template>
        <template #footer>
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            :disabled="isUpdating"
            @click="closeUpdateUserModal"
          />
          <UButton
            label="Update"
            color="primary"
            :loading="isUpdating"
            :disabled="isUpdating"
            @click="submitUpdateForm"
          />
        </template>
      </UModal>
      <!-- modal Delete user -->
      <UModal
        v-model:open="deleteUserModal"
        :ui="{ footer: 'justify-end', body: 'p-6' }"
      >
        <template #header>
          <h2 class="text-lg font-semibold">Hapus User</h2>
        </template>
        <template #body>
          <p>
            Apakah Anda yakin ingin menghapus user "{{ selectedUser?.name }}"?
          </p>
        </template>
        <template #footer>
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            :disabled="isDeleting"
            @click="closeDeleteUserModal"
          />
          <UButton
            label="Hapus"
            color="error"
            :loading="isDeleting"
            :disabled="isDeleting"
            @click="onDeleteUser"
          />
        </template>
      </UModal>
    </div>
    <!-- Table User -->
    <UTable :data="user" :columns="column" :loading="pending" class="flex-1" />
    <div class="flex justify-end mt-4">
      <UPagination
        v-model:page="params.page"
        :total="total"
        :items-per-page="params.limit"
        show-edges
      />
    </div>
  </UContainer>
</template>

<style lang="css" scoped></style>
