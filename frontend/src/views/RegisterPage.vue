<script setup>
import BaseButton from "../components/BaseButton.vue";
import BaseInput from "../components/BaseInput.vue";
import api from "../services/api.js";
import { useRouter } from "vue-router";
import { User, Envelope, Lock, Phone, MapMarker } from "@primeicons/vue";
import { reactive, ref } from "vue";
import AuthLayout from "../components/layout/AuthLayout.vue";
import { useToast } from "../composables/useToast.js";

const router = useRouter();
const { notify } = useToast();
const formData = reactive({ name: "", email: "", password: "", confirmPassword: "", phone: "", address: "", role: "customer" });
const formDataError = reactive({ name: "", email: "", password: "", confirmPassword: "", phone: "", address: "" });
const isSubmitting = ref(false);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm() {
  Object.keys(formDataError).forEach((field) => { formDataError[field] = ""; });
  let valid = true;
  if (!formData.name.trim()) { formDataError.name = "Name is required"; valid = false; }
  if (!formData.email.trim()) { formDataError.email = "Email is required"; valid = false; }
  else if (!emailPattern.test(formData.email.trim())) { formDataError.email = "Enter a valid email address"; valid = false; }
  const password = formData.password;
  if (!password) { formDataError.password = "Password is required"; valid = false; }
  else if (password.length < 8) { formDataError.password = "Password must be at least 8 characters"; valid = false; }
  else if (password.length > 16) { formDataError.password = "Password must be no more than 16 characters"; valid = false; }
  else if (!/[A-Z]/.test(password)) { formDataError.password = "Password needs an uppercase letter"; valid = false; }
  else if (!/[a-z]/.test(password)) { formDataError.password = "Password needs a lowercase letter"; valid = false; }
  else if (!/[0-9]/.test(password)) { formDataError.password = "Password needs a number"; valid = false; }
  else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) { formDataError.password = "Password needs a special character"; valid = false; }
  if (!formData.confirmPassword) { formDataError.confirmPassword = "Please confirm your password"; valid = false; }
  else if (password !== formData.confirmPassword) { formDataError.confirmPassword = "Passwords do not match"; valid = false; }
  if (!formData.phone.trim()) { formDataError.phone = "Phone is required"; valid = false; }
  if (!formData.address.trim()) { formDataError.address = "Address is required"; valid = false; }
  return valid;
}

async function submitForm() {
  if (!validateForm()) return;
  isSubmitting.value = true;
  const { confirmPassword, ...registrationData } = formData;
  try {
    await api.post(`/api/v1/users/register`, {
      ...registrationData,
      name: registrationData.name.trim(),
      email: registrationData.email.trim().toLowerCase(),
      phone: registrationData.phone.trim(),
      address: registrationData.address.trim(),
    });
    notify("Account created successfully. Please log in.", "green");
    await router.push("/login");
  } catch (error) {
    notify(error.response?.data?.message || "Could not connect to the server. Please try again.", "red");
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <main class="flex justify-center items-center min-h-screen py-8">
      <form novalidate @submit.prevent="submitForm"
        class="flex flex-col gap-4 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div class="flex flex-col gap-2">
          <BaseInput v-model="formData.name" placeholder="Enter Your Name" label="Name" type="text">
            <User class="h-4 w-4" />
          </BaseInput>
          <p v-if="formDataError.name" class="text-sm text-red-500">{{ formDataError.name }}</p>
        </div>
        <div class="flex flex-col gap-2">
          <label for="account-role" class="font-medium text-slate-600">Account type</label>
          <select id="account-role" v-model="formData.role"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option value="customer">Customer</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="flex flex-col gap-2">
          <BaseInput v-model="formData.email" placeholder="Enter Your Email" label="Email" type="email">
            <Envelope class="h-4 w-4" />
          </BaseInput>
          <p v-if="formDataError.email" class="text-sm text-red-500">{{ formDataError.email }}</p>
        </div>
        <div class="flex flex-col gap-2">
          <BaseInput v-model="formData.password" placeholder="Enter Your Password" label="Password" type="password">
            <Lock class="h-4 w-4" />
          </BaseInput>
          <p v-if="formDataError.password" class="text-sm text-red-500">{{ formDataError.password }}</p>
        </div>
        <div class="flex flex-col gap-2">
          <BaseInput v-model="formData.confirmPassword" placeholder="Confirm Your Password" label="Confirm Password"
            type="password">
            <Lock class="h-4 w-4" />
          </BaseInput>
          <p v-if="formDataError.confirmPassword" class="text-sm text-red-500">{{ formDataError.confirmPassword }}</p>
        </div>
        <div class="flex flex-col gap-2">
          <BaseInput v-model="formData.phone" placeholder="Enter Your Phone" label="Phone" type="tel">
            <Phone class="h-4 w-4" />
          </BaseInput>
          <p v-if="formDataError.phone" class="text-sm text-red-500">{{ formDataError.phone }}</p>
        </div>
        <div class="flex flex-col gap-2">
          <BaseInput v-model="formData.address" placeholder="Enter Your Address" label="Address" type="text">
            <MapMarker class="h-4 w-4" />
          </BaseInput>
          <p v-if="formDataError.address" class="text-sm text-red-500">{{ formDataError.address }}</p>
        </div>
        <BaseButton :text="isSubmitting ? 'CREATING ACCOUNT...' : 'REGISTER'" type="submit" :disabled="isSubmitting" />
      </form>
    </main>
  </AuthLayout>
</template>