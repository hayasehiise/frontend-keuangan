<script lang="ts" setup>
import type { TableColumn, FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";

definePageMeta({
  middleware: ["auth"],
  title: "Pengeluaran Management",
  meta: [
    {
      name: "description",
      content: "Halaman untuk mengelola daftar pengeluaran yang tersedia.",
    },
  ],
});

// Auth store untuk mengecek role user
const authStore = useAuthStore();

// pakai toast
const toast = useToast();

//type definitions untuk Jenis Pengeluaran
type JenisPengeluaran = {
  id: string;
  name: string;
};

// type definitions for Pengeluaran
type Pengeluaran = {
  id: string;
  jenisPengeluaranId: number;
  date: string;
  nominal: number;
  detailPencatatan: string;
  createdAt: string;
  createdBy: string;
  jenisPengeluaran: {
    name: string;
  };
  user: {
    name: string;
  };
};
type PengeluaranResponse = {
  data: Pengeluaran[];
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

// fetch Data Pengeluaran
const {
  data: response,
  pending,
  refresh: _refreshPengeluaran,
} = useApiFetch<PengeluaranResponse>("/pengeluaran", {
  query,
  method: "GET",
});

// fetch data Jenis Pengeluaran untuk select
const { data: JenisPengeluaranResponse } = useApiFetch<{
  data: JenisPengeluaran[];
}>("/jenis-pengeluaran/list", {
  method: "GET",
});

// Computed data untuk Pengeluaran
const pengeluaran = computed<Pengeluaran[]>(() => response.value?.data || []);
const total = computed(() => response.value?.total || 0);

// Computed data untuk Jenis Pengeluaran
const jenisPengeluaranList = computed(
  () => JenisPengeluaranResponse.value?.data || []
);

// State selected Jenis Pengeluaran
const selectedJenisPengeluaran = ref<JenisPengeluaran | null>(null);

// Schema untuk validasi untuk form pengeluaran
const addSchema = z.object({
  jenisPengeluaranId: z.string().min(1, "Jenis Pengeluaran Harus Dipilih"),
  date: z.string().min(1, "Masukan Tanggal Pengeluaran"),
  nominal: z.number().min(1, "Isi Nominal"),
  detailPencatatan: z.string().optional().or(z.literal("")),
});
type AddSchema = z.output<typeof addSchema>;

// Form State dan Ref
const formAddState = reactive<AddSchema>({
  jenisPengeluaranId: "",
  date: new Date().toISOString(),
  nominal: 0,
  detailPencatatan: "",
});
const formAddRef = ref();

// computed untuk Jenis Pengeluaran Select
const jenisPengeluaranOption = computed(() => {
  if (
    !jenisPengeluaranList.value ||
    !Array.isArray(jenisPengeluaranList.value)
  ) {
    return [];
  }
  return jenisPengeluaranList.value.map((item) => ({
    label: item.name,
    value: item.id,
  }));
});

// Computed untuk mengecek apakah user bisa menambah pengeluaran (hanya OWNER dan KASIR)
const canAddPengeluaran = computed(() => {
  const userRole = authStore.data?.role;
  return userRole === "OWNER" || userRole === "KASIR";
});

// Watcher untuk update selected Jenis Pengeluaran
watch(
  () => formAddState.jenisPengeluaranId,
  (newJenisId) => {
    if (newJenisId && jenisPengeluaranList.value) {
      const jenisData = jenisPengeluaranList.value.find(
        (item) => item.id === newJenisId
      );
      selectedJenisPengeluaran.value = jenisData || null;
    } else {
      selectedJenisPengeluaran.value = null;
    }
  }
);

// Modal State
const addModal = ref(false);
const addLoading = ref(false);

// function reset form
const resetForm = () => {
  Object.assign(formAddState, {
    jenisPengeluaranId: "",
    date: new Date().toISOString(),
    nominal: 0,
    detailPencatatan: "",
  });
};

//function onAdd handler form Add Pengeluaran
const onAdd = async (event: FormSubmitEvent<AddSchema>) => {
  event.preventDefault();
  addLoading.value = true;
  try {
    await addSchema.parseAsync(formAddState);
    // Konversi tanggal untuk disubmit
    const dataToSubmit = {
      ...formAddState,
      date: new Date(formAddState.date).toISOString(),
    };
    // Submit ke API
    await useApiFetchInput("/pengeluaran", {
      method: "POST",
      body: dataToSubmit,
    });
    toast.add({
      title: "Sukses",
      description: "Data berhasil ditambahkan",
      color: "success",
    });
    addModal.value = false;
    resetForm();
    selectedJenisPengeluaran.value = null;
    await _refreshPengeluaran();
  } catch {
    toast.add({
      title: "Gagal",
      description: "Data gagal ditambahkan",
      color: "error",
    });
  } finally {
    addLoading.value = false;
  }
};

// function submit form add
const submitAddForm = async () => {
  if (formAddRef.value) {
    await formAddRef.value.submit();
  }
};

// watch ketika modal add ditutup
watch(addModal, (isOpen) => {
  if (!isOpen) {
    resetForm();
  }
});

// Function untuk format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value);
};

// Function untuk format tanggal
const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
};

// Kolom untuk tabel Pengeluaran
const columns: TableColumn<Pengeluaran>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) =>
      (params.value.page - 1) * params.value.limit + row.index + 1,
  },
  {
    accessorKey: "jenisPengeluaran.name",
    header: "Jenis Pengeluaran",
    cell: ({ row }) => row.original.jenisPengeluaran.name,
  },
  {
    accessorKey: "date",
    header: "Tanggal",
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: "nominal",
    header: "Nominal",
    cell: ({ row }) => formatCurrency(row.original.nominal),
  },
  {
    accessorKey: "detailPencatatan",
    header: "Detail Pencatatan",
    cell: ({ row }) =>
      row.original.detailPencatatan === ""
        ? "<Tanpa Catatan>"
        : row.original.detailPencatatan,
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat Pada",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    accessorKey: "createdBy.name",
    header: "Dibuat Oleh",
    cell: ({ row }) => row.original.user.name,
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      return h("div", { class: "flex gap-2" }, [
        h(resolveComponent("UButton"), {
          icon: "i-lucide-edit",
          variant: "solid",
          color: "primary",
          size: "sm",
          onClick: () => {
            console.log("Edit Pengeluaran", row.original);
          },
        }),
        h(resolveComponent("UButton"), {
          icon: "i-lucide-trash-2",
          variant: "solid",
          color: "error",
          size: "sm",
          onClick: () => {
            console.log("Hapus Pengeluaran", row.original);
          },
        }),
      ]);
    },
  },
];
</script>

<template>
  <UContainer>
    <h1 class="text-2xl font-bold mb-4">Daftar Pengeluaran</h1>
    <div class="flex flex-row gap-4 mb-6">
      <UInput
        v-model="params.search"
        placeholder="Cari Pengeluaran..."
        icon="i-lucide-search"
        @input="_refreshPengeluaran"
      />
      <UModal
        v-model:open="addModal"
        title="Tambah Pengeluaran"
        description="Form untuk menambahkan data pengeluaran"
        :ui="{ footer: 'justify-end' }"
      >
        <!-- Tombol untuk show modal add -->
        <UButton
          v-if="canAddPengeluaran"
          label="Tambah Data"
          icon="i-lucide-circle-plus"
        />
        <!-- isi Modal -->
        <template #body>
          <UForm
            ref="formAddRef"
            :state="formAddState"
            :schema="addSchema"
            @submit="onAdd"
          >
            <UFormField
              name="jenisPengeluaranId"
              label="Jenis Pengeluaran"
              required
            >
              <USelect
                v-model="formAddState.jenisPengeluaranId"
                :items="jenisPengeluaranOption"
                placeholder="Pilih Jenis Pengeluaran"
                class="w-auto"
                :disabled="addLoading"
              />
            </UFormField>
            <UFormField name="date" label="Tanggal Pengeluaran" required>
              <UInput
                v-model="formAddState.date"
                type="date"
                class="w-auto"
                :disabled="addLoading"
              />
            </UFormField>
            <UFormField name="nominal" label="Total Pengeluaran">
              <UInputNumber
                v-model="formAddState.nominal"
                :min="0"
                :format-options="{
                  minimumFractionDigits: 0,
                  style: 'currency',
                  currency: 'IDR',
                  currencyDisplay: 'narrowSymbol',
                  currencySign: 'standard',
                }"
                :disabled="addLoading"
              />
            </UFormField>
            <UFormField name="detailPencatatan" label="Deskripsi">
              <UTextarea
                v-model="formAddState.detailPencatatan"
                placeholder="Masukan Catatan (Optional)"
                autoresize
                class="w-full"
                :disabled="addLoading"
              />
            </UFormField>
          </UForm>
        </template>
        <template #footer="{ close }">
          <UButton
            label="Batal"
            variant="outline"
            color="neutral"
            icon="i-lucide-save-off"
            @click="close"
          />
          <UButton
            label="Simpan"
            variant="solid"
            color="primary"
            icon="i-lucide-save"
            :loading="addLoading"
            :disabled="addLoading"
            @click="submitAddForm"
          />
        </template>
      </UModal>
    </div>

    <!-- Table Pengeluaran -->
    <UTable
      :data="pengeluaran"
      :columns="columns"
      :loading="pending"
      class="flex-1"
    />

    <!-- Pagination -->
    <div class="flex justify-between items-center mt-4">
      <div class="text-sm text-gray-400">
        Menampilkan
        {{ pengeluaran.length > 0 ? (params.page - 1) * params.limit + 1 : 0 }}
        sampai {{ Math.min(params.page * params.limit, total) }} dari
        {{ total }} pengeluaran
      </div>
      <UPagination
        v-model:page="params.page"
        :total="total"
        :items-per-page="params.limit"
        :sibling-count="1"
        show-edges
      />
    </div>
  </UContainer>
</template>

<style lang="css" scoped></style>
