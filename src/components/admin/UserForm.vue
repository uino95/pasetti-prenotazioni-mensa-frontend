<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { User, CreateUserRequest, UpdateUserRequest } from '@/api/admin/users'
import { Button } from '@/components/ui/button'

interface Props {
  user?: User | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: CreateUserRequest | UpdateUserRequest]
  cancel: []
}>()

const { t } = useI18n()

const username = ref('')
const email = ref('')
// const password = ref('')
const isEditMode = ref(false)

const resetForm = () => {
  username.value = ''
  email.value = ''
  // password.value = ''
}

const handleSubmit = () => {
  if (isEditMode.value && props.user) {
    const updateData: UpdateUserRequest = {
      username: username.value,
      email: email.value,
    }
    emit('submit', updateData)
  } else {
    const createData: CreateUserRequest = {
      username: username.value,
      email: email.value,
      password: username.value.toLowerCase().split(' ').join('.'),
    }
    emit('submit', createData)
  }
}

const handleCancel = () => {
  resetForm()
  emit('cancel')
}

onMounted(() => {
  if (props.user) {
    isEditMode.value = true
    username.value = props.user.username || ''
    email.value = props.user.email || ''
  } else {
    isEditMode.value = false
    resetForm()
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="handleCancel"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            {{ isEditMode ? t('admin.users.editUser') : t('admin.users.createUser') }}
          </h3>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
                {{ t('admin.users.username') }} *
              </label>
              <input
                id="username"
                v-model="username"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                {{ t('admin.users.email') }} *
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div class="flex justify-end gap-3 pt-4">
              <Button type="button" @click="handleCancel" variant="secondary">
                {{ t('admin.cancel') }}
              </Button>
              <Button type="submit">
                {{ isEditMode ? t('admin.save') : t('admin.create') }}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped></style>
