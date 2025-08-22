<template>
  <UContainer>
    <h1 class="text-2xl font-bold mb-4">Daftar Jenis Pengeluaran</h1>

    <!-- Search Input -->
    <div class="flex flex-row gap-4 mb-6">
      <UInput
        v-model="params.search"
        placeholder="Cari Jenis Pengeluaran"
        class="w-full max-w-xs"
        icon="i-lucide-search"
        @input="_refreshJenisPengeluaran"
      />

      <!-- Modal Tambah Jenis Pengeluaran -->
      <UModal
        v-model:open="addModal"
        :ui="{ footer: 'justify-end' }"
        title="Tambah Jenis Pengeluaran"
        description="Form Untuk menambahkan jenis pengeluaran"
      >
        <!-- Tombol Add Modal -->
        <UButton label="Tambah Data" icon="i-lucide-circle-plus" />

        <!-- Isi dari modal -->
        <template #body>
          <!-- Form untuk tambah jenis pengeluaran -->
          <UForm
            ref="formAddRef"
            :state="formAddState"
            :schema="addSchema"
            @submit="onAdd"
          >
            <UFormField label="Nama Jenis Pengeluaran" name="name">
              <UInput
                v-model="formAddState.name"
                placeholder="Contoh : Gaji Pegawai"
              />
            </UFormField>
          </UForm>
        </template>

        <template #footer>
          <UButton
            label="Batal"
            variant="outline"
            color="neutral"
            icon="i-lucide-save-off"
            @click="addModal = false"
          />
          <UButton
            label="Simpan"
            variant="solid"
            color="primary"
            icon="i-lucide-save"
            :loading="addLoading"
            :disabled="addLoading"
            @click="addSubmit"
          />
        </template>
      </UModal>
    </div>
    <!-- Jenis Pengeluaran Table -->
    <UTable
      :data="jenisPengeluaran"
      :columns="columns"
      :loading="pending"
      class="mb-6"
    />
    <!-- Modal Hapus Data -->
    <UModal
      v-model:open="deleteModal"
      title="Hapus Data"
      description="Hapus Data Jenis Pengeluaran"
      :ui="{ footer: 'justify-end', body: 'p-6' }"
    >
      <template #body>
        <div class="flex flex-row gap-4 items-center">
          <UIcon name="i-lucide-triangle-alert" class="size-10" />
          <div class="flex flex-col">
            <p>
              Apakah anda yakin ingin menghapus data ini
              <span class="font-semibold"> "{{ selectedRow?.name }}" </span>
            </p>
            <p class="text-red-400 text-sm mt-2">
              Aksi ini tidak dapat dibatalkan
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <UButton
          label="Batal"
          variant="outline"
          color="neutral"
          @click="deleteModal = false"
        />
        <UButton
          label="Hapus"
          variant="solid"
          color="error"
          :loading="deleteLoading"
          :disabled="deleteLoading"
          @click="onDelete"
        />
      </template>
    </UModal>
    <!-- Pagination -->
    <div class="flex justify-between items-center">
      <span class="text-sm text-gray-600">
        Menampilkan {{ jenisPengeluaran.length }} dari {{ total }} data
      </span>
      <UPagination
        v-model:page="params.page"
        :total="total"
        :limit="params.limit"
        show-edges
      />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
// import { h, resolveComponent } from "vue";
import type { TableColumn, FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";
definePageMeta({
  middleware: ["auth"],
  title: "Jenis Pengeluaran Management",
  meta: [
    {
      name: "description",
      content:
        "Halaman untuk mengelola daftar jenis pengeluaran yang tersedia.",
    },
  ],
});

// Pakai Toast
const toast = useToast();

// type definitions for Jenis Pengeluaran
type JenisPengeluaran = {
  id: number;
  name: string;
  createdAt: string;
};

type JenisPengeluaranResponse = {
  data: JenisPengeluaran[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

// Parameter untuk page, limit, dan search
const params = ref({
  page: 1,
  limit: 10,
  search: "",
});

// Query untuk Pagination dan Search
const query = computed(() => ({
  page: params.value.page,
  limit: params.value.limit,
  ...(params.value.search ? { search: params.value.search } : {}),
}));

// fetch Data Jenis Pengeluaran
const {
  data: response,
  pending,
  refresh: _refreshJenisPengeluaran,
} = useApiFetch<JenisPengeluaranResponse>("/jenis-pengeluaran", {
  query,
  method: "GET",
});

// Computed data untuk Jenis Pengeluaran
const jenisPengeluaran = computed<JenisPengeluaran[]>(
  () => response.value?.data || []
);
const total = computed(() => response.value?.total || 0);

// Function untuk format tanggal
const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
};

// Kolom untuk tabel Jenis Pengeluaran
const columns: TableColumn<JenisPengeluaran>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) =>
      (params.value.page - 1) * params.value.limit + row.index + 1,
  },
  {
    accessorKey: "name",
    header: "Nama Jenis Pengeluaran",
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal Dibuat",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const item = row.original;
      return h(resolveComponent("UButton"), {
        icon: "i-lucide-trash-2",
        color: "error",
        variant: "solid",
        onClick: () => openDeleteModal(item),
      });
    },
  },
];

// Modal State add Jenis Pengeluaran
const addModal = ref(false);
const addLoading = ref(false);
const deleteModal = ref(false);
const deleteLoading = ref(false);

// State dan Ref Form Jenis Pengeluaran
const formAddState = reactive<AddSchema>({
  name: "",
});
const formAddRef = ref();

// Schema form Add Jenis Pengeluaran
const addSchema = z.object({
  name: z.string().min(1, "Masukan Nama Jenis Pengeluaran"),
});
type AddSchema = z.output<typeof addSchema>;

// Function onAdd Form Tambah Jenis Pengeluaran
const onAdd = async (event: FormSubmitEvent<AddSchema>) => {
  event.preventDefault();
  addLoading.value = true;

  try {
    await addSchema.parseAsync(formAddState);
    await useApiFetchInput<AddSchema>("/jenis-pengeluaran", {
      method: "POST",
      body: formAddState,
    });

    toast.add({
      title: "Berhasil",
      description: "Data Berhasil Ditambahkan",
      color: "success",
    });
    addModal.value = false; // Menutup Modal Add
    await _refreshJenisPengeluaran(); // Refresh Data List
  } catch {
    toast.add({
      title: "Gagal",
      description: "Data Tidak Berhasil Ditambahkan",
      color: "error",
    });
  } finally {
    Object.assign(formAddState, {
      name: "",
    });
    addLoading.value = false;
  }
};

// Reset Form Add
const resetFormAdd = () => {
  Object.assign(formAddState, {
    name: "",
  });
};

// Function Submit Form untuk Tombol di Footer Modal
const addSubmit = async () => {
  if (formAddRef.value) {
    console.log(formAddRef.value);
    await formAddRef.value.submit();
  }
};

// watch ketika modal ditutup
watch(addModal, (isOpen) => {
  if (!isOpen) {
    resetFormAdd();
  }
});

// Selected Row Data untuk Update dan Delete
const selectedRow = ref<JenisPengeluaran | null>(null);

// Function open Delete Modal
const openDeleteModal = (data: JenisPengeluaran) => {
  selectedRow.value = data;
  deleteModal.value = true;
};

// Function untuk menghapus data Jenis Pengeluaran
const onDelete = async () => {
  if (!selectedRow.value) return;
  deleteLoading.value = true;
  try {
    await useApiFetchInput(`/jenis-pengeluaran/${selectedRow.value.id}`, {
      method: "DELETE",
    });
    toast.add({
      title: "Berhasil",
      description: "Data Berhasil Dihapus",
      color: "success",
    });
    deleteModal.value = false;
    selectedRow.value = null;
    await _refreshJenisPengeluaran();
  } catch {
    toast.add({
      title: "Gagal",
      description: "Data Tidak Berhasil Dihapus",
      color: "error",
    });
  } finally {
    deleteLoading.value = false;
  }
};

// watch ketika modal delete ditutup
watch(deleteModal, (isOpen) => {
  if (!isOpen) {
    selectedRow.value = null;
  }
});
</script>

<style scoped></style>
