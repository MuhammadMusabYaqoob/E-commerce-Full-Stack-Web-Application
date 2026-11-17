<script setup>
import api from "../../services/api.js";
import { inject, reactive, ref } from "vue";
import { useToast } from "../../composables/useToast.js";

const { user, setUser } = inject("auth");
const { notify } = useToast();
const isEditing = ref(false);
const isSaving = ref(false);
const isChangingPassword = ref(false);
const passwordForm = reactive({ currentPassword: "", newPassword: "", confirmPassword: "" });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const form = reactive({
  name: user.value?.name || "",
  email: user.value?.email || "",
  phone: user.value?.phone || "",
  address: user.value?.address || "",
});

function clearPasswordForm() {
  passwordForm.currentPassword = "";
  passwordForm.newPassword = "";
  passwordForm.confirmPassword = "";
}

function cancelEditing() {
  Object.assign(form, {
    name: user.value?.name || "",
    email: user.value?.email || "",
    phone: user.value?.phone || "",
    address: user.value?.address || "",
  });
  clearPasswordForm();
isEditing.value = false;
}

async function saveProfile() {
  if (![form.name, form.email, form.phone, form.address].every((value) => value.trim())) {
    notify("Please fill in all profile fields.", "red");
    return;
  }
  if (!emailPattern.test(form.email.trim())) {
    notify("Please enter a valid email address.", "red");
    return;
  }

  isSaving.value = true;
  try {
    const response = await api.patch(
      `/api/v1/users/update-profile`,
      { name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(), address: form.address.trim() },
      { withCredentials: true }
    );
    const updatedUser = response.data.data.user;
    setUser(updatedUser);
    Object.assign(form, { name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone, address: updatedUser.address });
    clearPasswordForm();
isEditing.value = false;
    notify("Profile updated successfully.", "green");
  } catch (error) {
    notify(error.response?.data?.message || "Could not update your profile. Please try again.", "red");
  } finally {
    isSaving.value = false;
  }
}

async function changePassword() {
  const { currentPassword, newPassword, confirmPassword } = passwordForm;
  if (!currentPassword || !newPassword || !confirmPassword) {
    notify("Enter your current password and complete both new password fields.", "red");
    return;
  }
  if (newPassword !== confirmPassword) {
    notify("The new passwords do not match.", "red");
    return;
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/.test(newPassword)) {
    notify("Use 8–16 characters with uppercase, lowercase, a number, and a special character.", "red");
    return;
  }

  isChangingPassword.value = true;
  try {
    const response = await api.patch(
      `/api/v1/users/change-password`,
      { currentPassword, newPassword },
      { withCredentials: true }
    );
    clearPasswordForm();
    notify(response.data.message || "Password changed successfully.", "green");
  } catch (error) {
    notify(error.response?.data?.message || "Could not change your password. Please try again.", "red");
  } finally {
    isChangingPassword.value = false;
  }
}
</script>

<template>
  <section>
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">Your Profile</h2>
        <p class="mt-1 text-sm text-slate-500">View and update your account details.</p>
      </div>
      <button v-if="!isEditing" type="button" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700" @click="isEditing = true">
        Edit profile
      </button>
    </div>

    <form class="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6" @submit.prevent="saveProfile">
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block text-sm font-medium text-slate-700">Name
          <input v-model="form.name" :disabled="!isEditing" autocomplete="name" class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" />
        </label>
        <label class="block text-sm font-medium text-slate-700">Email
          <input v-model="form.email" :disabled="!isEditing" type="email" autocomplete="email" class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" />
        </label>
        <label class="block text-sm font-medium text-slate-700">Phone
          <input v-model="form.phone" :disabled="!isEditing" type="tel" autocomplete="tel" class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" />
        </label>
        <label class="block text-sm font-medium text-slate-700 sm:col-span-2">Address
          <textarea v-model="form.address" :disabled="!isEditing" rows="3" autocomplete="street-address" class="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"></textarea>
        </label>
      </div>
      <p class="text-xs text-slate-500">Account type: {{ user?.role }}</p>

      <section v-if="isEditing" class="border-t border-slate-100 pt-5">
        <h3 class="text-lg font-semibold text-slate-800">Change password</h3>
        <p class="mt-1 text-sm text-slate-500">Confirm your current password before choosing a new one.</p>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label class="block text-sm font-medium text-slate-700 sm:col-span-2">Current password
            <input v-model="passwordForm.currentPassword" type="password" autocomplete="current-password" :disabled="!isEditing || isChangingPassword" class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" />
          </label>
          <label class="block text-sm font-medium text-slate-700">New password
            <input v-model="passwordForm.newPassword" type="password" autocomplete="new-password" :disabled="!isEditing || isChangingPassword" class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" />
          </label>
          <label class="block text-sm font-medium text-slate-700">Confirm new password
            <input v-model="passwordForm.confirmPassword" type="password" autocomplete="new-password" :disabled="!isEditing || isChangingPassword" class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" />
          </label>
        </div>
        <button type="button" :disabled="isChangingPassword" class="mt-4 rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60" @click="changePassword">
          {{ isChangingPassword ? "Changing…" : "Change password" }}
        </button>
      </section>
      <div v-if="isEditing" class="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
        <button type="submit" :disabled="isSaving" class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
          {{ isSaving ? "Saving…" : "Save changes" }}
        </button>
        <button type="button" :disabled="isSaving" class="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60" @click="cancelEditing">
          Cancel
        </button>
      </div>
    </form>
  </section>
</template>