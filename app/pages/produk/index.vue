<script lang="ts" setup>
import type { TableColumn, FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";
// import { h, resolveComponent } from "vue";

definePageMeta({
  middleware: ["auth"],
  title: "Produk Management",
  meta: [
    {
      name: "description",
      content: "Halaman untuk mengelola daftar produk yang tersedia.",
    },
  ],
});

// Auth store untuk mengecek role user
const authStore = useAuthStore();

// Type untuk data Produk
type Product = {
  id: string;
  nama: string;
  harga: number;
  stock: number;
  status: string;
  tokoId: string;
  createdAt: string;
  toko: {
    nama: string;
  };
};

type ProductResponse = {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

// Parameter untuk pagination dan search
const params = ref({
  page: 1,
  limit: 10,
  search: "",
});

// Query untuk pagination dan search
const query = computed(() => ({
  page: params.value.page,
  limit: params.value.limit,
  ...(params.value.search ? { search: params.value.search } : {}),
}));

// Fetch data produk dengan pagination dan search
const {
  data: response,
  pending,
  refresh: _productRefresh,
} = await useApiFetch<ProductResponse>("/produk", {
  method: "GET",
  query,
});

// Computed produk, total, dan kolom untuk table
const products = computed<Product[]>(() => response.value?.data || []);
const total = computed(() => response.value?.total ?? 0);

// Fungsi untuk format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Fungsi untuk format tanggal
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
};

// Kolom untuk table
const columns: TableColumn<Product>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) =>
      (params.value.page - 1) * params.value.limit + row.index + 1,
  },
  {
    accessorKey: "nama",
    header: "Nama Produk",
  },
  {
    accessorKey: "harga",
    header: "Harga",
    cell: ({ row }) => formatCurrency(row.original.harga),
  },
  {
    accessorKey: "stock",
    header: "Stok",
    cell: ({ row }) => `${row.original.stock} pcs`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return h(
        "span",
        {
          class:
            status === "TERSEDIA"
              ? "px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
              : "px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium",
        },
        status
      );
    },
  },
  {
    accessorKey: "toko",
    header: "Toko",
    cell: ({ row }) => row.original.toko.nama,
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat Tanggal",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    accessorKey: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const UButton = resolveComponent("UButton");
      const userRole = authStore.data?.role;
      const canUpdate = userRole === "OWNER" || userRole === "KASIR";

      const buttons = [
        h(UButton, {
          icon: "i-lucide-trash",
          color: "error",
          size: "sm",
          onClick: () => openDeleteProductModal(row.original),
        }),
      ];

      if (canUpdate) {
        buttons.unshift(
          h(UButton, {
            icon: "i-lucide-edit",
            color: "primary",
            size: "sm",
            onClick: () => openUpdateProductModal(row.original),
          }),
          h(UButton, {
            icon: "i-lucide-plus",
            color: "neutral",
            size: "sm",
            onClick: () => openAddStockModal(row.original),
          })
        );
      }

      return h("div", { class: "flex gap-2" }, buttons);
    },
  },
];

// Modal State
const addProductModal = ref(false);
const updateProductModal = ref(false);
const addStockModal = ref(false);
const deleteProductModal = ref(false);
const isSubmitting = ref(false);
const isUpdating = ref(false);
const isAddingStock = ref(false);
const isDeleting = ref(false);

// Form reference untuk validasi
const formRef = ref();
const updateFormRef = ref();
const addStockFormRef = ref();

// Selected product untuk update/delete/add stock
const selectedProduct = ref<Product | null>(null);

// Import toast composable
const toast = useToast();

// Schema validasi untuk form produk
const schema = z.object({
  nama: z.string().min(1, "Nama produk tidak boleh kosong"),
  harga: z.number().min(1, "Harga harus lebih dari 0"),
  stock: z.number().min(0, "Stok tidak boleh negatif"),
});

type Schema = z.output<typeof schema>;

// Schema untuk update product
const updateSchema = z.object({
  nama: z.string().min(1, "Nama produk tidak boleh kosong"),
  harga: z.number().min(1, "Harga harus lebih dari 0"),
  stock: z.number().min(0, "Stok tidak boleh negatif"),
});
type UpdateSchema = z.output<typeof updateSchema>;

// Schema untuk add stock
const addStockSchema = z.object({
  additionalStock: z
    .number()
    .min(1, "Jumlah stok yang ditambah harus lebih dari 0"),
});
type AddStockSchema = z.output<typeof addStockSchema>;

// Reactive state untuk form
const formState = reactive<Schema>({
  nama: "",
  harga: 0,
  stock: 0,
});

// Reactive state untuk update form
const updateFormState = reactive<UpdateSchema>({
  nama: "",
  harga: 0,
  stock: 0,
});

// Reactive state untuk add stock form
const addStockFormState = reactive<AddStockSchema>({
  additionalStock: 0,
});

// Computed untuk mengecek apakah user bisa menambah produk (hanya OWNER dan KASIR)
const canAddProduct = computed(() => {
  const userRole = authStore.data?.role;
  return userRole === "OWNER" || userRole === "KASIR";
});

// Form Submit Handler
async function onSubmit(event: FormSubmitEvent<Schema>) {
  event.preventDefault();
  isSubmitting.value = true;

  try {
    await schema.parseAsync(formState);

    // Submit ke API
    await useApiFetchInput("/produk", {
      method: "POST",
      body: formState,
    });

    toast.add({
      title: "Produk berhasil ditambahkan",
      color: "success",
    });

    addProductModal.value = false;

    // Reset form state
    Object.assign(formState, {
      nama: "",
      harga: 0,
      stock: 0,
    });

    await _productRefresh(); // Refresh product list after adding new product
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
        title: "Terjadi kesalahan saat menambahkan produk",
        color: "error",
      });
    }
  } finally {
    isSubmitting.value = false;
  }
}

// Function untuk submit form dari footer modal
async function submitForm() {
  if (formRef.value) {
    await formRef.value.submit();
  }
}

// Function untuk membuka modal
function openAddProductModal() {
  addProductModal.value = true;
}

// Function untuk menutup modal dan reset form
function closeAddProductModal() {
  addProductModal.value = false;
  Object.assign(formState, {
    nama: "",
    harga: 0,
    stock: 0,
  });
}

// Update Product Handlers
async function onUpdateSubmit(event: FormSubmitEvent<UpdateSchema>) {
  event.preventDefault();
  isUpdating.value = true;

  try {
    await updateSchema.parseAsync(updateFormState);

    await useApiFetchInput(`/produk/${selectedProduct.value?.id}`, {
      method: "PUT",
      body: updateFormState,
    });

    toast.add({
      title: "Produk berhasil diperbarui",
      color: "success",
    });

    updateProductModal.value = false;
    selectedProduct.value = null;

    // Reset form state
    Object.assign(updateFormState, {
      nama: "",
      harga: 0,
      stock: 0,
    });

    await _productRefresh();
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
        title: "Terjadi kesalahan saat memperbarui produk",
        color: "error",
      });
    }
  } finally {
    isUpdating.value = false;
  }
}

async function submitUpdateForm() {
  if (updateFormRef.value) {
    await updateFormRef.value.submit();
  }
}

function openUpdateProductModal(product: Product) {
  selectedProduct.value = product;
  updateFormState.nama = product.nama;
  updateFormState.harga = product.harga;
  updateFormState.stock = product.stock;
  updateProductModal.value = true;
}

function closeUpdateProductModal() {
  updateProductModal.value = false;
  selectedProduct.value = null;
  Object.assign(updateFormState, {
    nama: "",
    harga: 0,
    stock: 0,
  });
}

// Add Stock Handlers
async function onAddStockSubmit(event: FormSubmitEvent<AddStockSchema>) {
  event.preventDefault();
  isAddingStock.value = true;

  try {
    await addStockSchema.parseAsync(addStockFormState);

    const newStock =
      (selectedProduct.value?.stock || 0) + addStockFormState.additionalStock;

    await useApiFetchInput(`/produk/${selectedProduct.value?.id}`, {
      method: "PUT",
      body: {
        nama: selectedProduct.value?.nama,
        harga: selectedProduct.value?.harga,
        stock: newStock,
      },
    });

    toast.add({
      title: `Stok berhasil ditambah sebanyak ${addStockFormState.additionalStock} pcs`,
      color: "success",
    });

    addStockModal.value = false;
    selectedProduct.value = null;

    // Reset form state
    Object.assign(addStockFormState, {
      additionalStock: 0,
    });

    await _productRefresh();
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
        title: "Terjadi kesalahan saat menambah stok",
        color: "error",
      });
    }
  } finally {
    isAddingStock.value = false;
  }
}

async function submitAddStockForm() {
  if (addStockFormRef.value) {
    await addStockFormRef.value.submit();
  }
}

function openAddStockModal(product: Product) {
  selectedProduct.value = product;
  addStockFormState.additionalStock = 0;
  addStockModal.value = true;
}

function closeAddStockModal() {
  addStockModal.value = false;
  selectedProduct.value = null;
  Object.assign(addStockFormState, {
    additionalStock: 0,
  });
}

// Delete Product Handlers
async function onDeleteProduct() {
  if (!selectedProduct.value) return;

  isDeleting.value = true;

  try {
    await useApiFetchInput(`/produk/${selectedProduct.value.id}`, {
      method: "DELETE",
    });

    toast.add({
      title: "Produk berhasil dihapus",
      color: "success",
    });

    deleteProductModal.value = false;
    selectedProduct.value = null;

    await _productRefresh();
  } catch (error) {
    console.error(error);
    toast.add({
      title: "Terjadi kesalahan saat menghapus produk",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
}

function openDeleteProductModal(product: Product) {
  selectedProduct.value = product;
  deleteProductModal.value = true;
}

function closeDeleteProductModal() {
  deleteProductModal.value = false;
  selectedProduct.value = null;
}
</script>

<template>
  <UContainer>
    <h1 class="text-2xl font-bold mb-4">Daftar Produk</h1>

    <!-- Search Input dan Button Tambah Produk -->
    <div class="flex flex-row gap-4 mb-6">
      <UInput
        v-model="params.search"
        placeholder="Cari produk..."
        class="w-64"
        icon="i-lucide-search"
        @input="_productRefresh"
      />
      <UButton
        v-if="canAddProduct"
        icon="i-lucide-circle-plus"
        label="Tambah Produk"
        color="primary"
        @click="openAddProductModal"
      />

      <!-- Modal Add Product -->
      <UModal
        v-model:open="addProductModal"
        :ui="{ footer: 'justify-end', body: 'p-6' }"
      >
        <template #header>
          <h2 class="text-lg font-semibold">Tambah Produk Baru</h2>
        </template>
        <template #body>
          <UForm
            ref="formRef"
            :schema="schema"
            :state="formState"
            class="space-y-4"
            @submit="onSubmit"
          >
            <UFormField label="Nama Produk" name="nama" required>
              <UInput
                v-model="formState.nama"
                placeholder="Masukan nama produk"
                class="w-full"
                :disabled="isSubmitting"
              />
            </UFormField>
            <UFormField label="Harga" name="harga" required>
              <UInputNumber
                v-model="formState.harga"
                :min="0"
                :format-options="{
                  minimumFractionDigits: 0,
                  style: 'currency',
                  currency: 'IDR',
                  currencyDisplay: 'narrowSymbol',
                  currencySign: 'standard',
                }"
                :disabled="isSubmitting"
              />
            </UFormField>
            <UFormField label="Stok" name="stock" required>
              <UInputNumber
                v-model.number="formState.stock"
                :min="0"
                :disabled="isSubmitting"
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
            @click="closeAddProductModal"
          />
          <UButton
            label="Submit"
            color="primary"
            icon="i-lucide-save"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="submitForm"
          />
        </template>
      </UModal>

      <!-- Modal Update Product -->
      <UModal
        v-model:open="updateProductModal"
        :ui="{ footer: 'justify-end', body: 'p-6' }"
      >
        <template #header>
          <h2 class="text-lg font-semibold">Update Produk</h2>
        </template>
        <template #body>
          <UForm
            ref="updateFormRef"
            :schema="updateSchema"
            :state="updateFormState"
            class="space-y-4"
            @submit="onUpdateSubmit"
          >
            <UFormField label="Nama Produk" name="nama" required>
              <UInput
                v-model="updateFormState.nama"
                placeholder="Masukan nama produk"
                class="w-full"
                :disabled="isUpdating"
              />
            </UFormField>
            <UFormField label="Harga" name="harga" required>
              <UInputNumber
                v-model="updateFormState.harga"
                :min="0"
                :format-options="{
                  minimumFractionDigits: 0,
                  style: 'currency',
                  currency: 'IDR',
                  currencyDisplay: 'narrowSymbol',
                  currencySign: 'standard',
                }"
                :disabled="isSubmitting"
              />
            </UFormField>
            <UFormField label="Stok" name="stock" required>
              <UInputNumber
                v-model="updateFormState.stock"
                :min="0"
                :disabled="isSubmitting"
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
            @click="closeUpdateProductModal"
          />
          <UButton
            label="Update"
            color="primary"
            icon="i-lucide-save"
            :loading="isUpdating"
            :disabled="isUpdating"
            @click="submitUpdateForm"
          />
        </template>
      </UModal>

      <!-- Modal Add Stock -->
      <UModal
        v-model:open="addStockModal"
        :ui="{ footer: 'justify-end', body: 'p-6' }"
      >
        <template #header>
          <h2 class="text-lg font-semibold">Tambah Stok Produk</h2>
        </template>
        <template #body>
          <div class="mb-4">
            <p class="text-sm text-gray-600">
              Produk:
              <span class="font-semibold">{{ selectedProduct?.nama }}</span>
            </p>
            <p class="text-sm text-gray-600">
              Stok saat ini:
              <span class="font-semibold"
                >{{ selectedProduct?.stock }} pcs</span
              >
            </p>
          </div>
          <UForm
            ref="addStockFormRef"
            :schema="addStockSchema"
            :state="addStockFormState"
            class="space-y-4"
            @submit="onAddStockSubmit"
          >
            <UFormField
              label="Jumlah Stok yang Ditambah"
              name="additionalStock"
              required
            >
              <UInputNumber
                v-model.number="addStockFormState.additionalStock"
                :min="0"
                :disabled="isSubmitting"
              />
            </UFormField>
          </UForm>
        </template>
        <template #footer>
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            :disabled="isAddingStock"
            @click="closeAddStockModal"
          />
          <UButton
            label="Tambah Stok"
            color="primary"
            icon="i-lucide-save"
            :loading="isAddingStock"
            :disabled="isAddingStock"
            @click="submitAddStockForm"
          />
        </template>
      </UModal>

      <!-- Modal Delete Product -->
      <UModal
        v-model:open="deleteProductModal"
        :ui="{ footer: 'justify-end', body: 'p-6' }"
      >
        <template #header>
          <h2 class="text-lg font-semibold">Hapus Produk</h2>
        </template>
        <template #body>
          <p>
            Apakah Anda yakin ingin menghapus produk
            <span class="font-semibold">"{{ selectedProduct?.nama }}"</span>?
          </p>
          <p class="text-sm text-gray-500 mt-2">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </template>
        <template #footer>
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            :disabled="isDeleting"
            @click="closeDeleteProductModal"
          />
          <UButton
            label="Hapus"
            color="error"
            icon="i-lucide-trash"
            :loading="isDeleting"
            :disabled="isDeleting"
            @click="onDeleteProduct"
          />
        </template>
      </UModal>
    </div>

    <!-- Table Produk -->
    <UTable
      :data="products"
      :columns="columns"
      :loading="pending"
      class="flex-1"
    />

    <!-- Pagination -->
    <div class="flex justify-between items-center mt-4">
      <div class="text-sm text-gray-500">
        Menampilkan
        {{ products.length > 0 ? (params.page - 1) * params.limit + 1 : 0 }}
        sampai {{ Math.min(params.page * params.limit, total) }} dari
        {{ total }} produk
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
