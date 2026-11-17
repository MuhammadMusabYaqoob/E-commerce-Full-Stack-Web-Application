<script setup>
import BaseButton from '../components/BaseButton.vue';
import BaseInput from '../components/BaseInput.vue';
import { useToast } from '../composables/useToast';
import api from '../services/api.js';
import { useRoute, useRouter } from 'vue-router';
import { inject } from "vue";

const router = useRouter();
const route = useRoute();
const { setUser } = inject("auth");

import { Envelope, Lock } from '@primeicons/vue';
import { reactive, ref } from 'vue';
import AuthLayout from '../components/layout/AuthLayout.vue';


const formData = reactive({
    email: '',
    password: '',
})
const formDataError = reactive({
    email: '',
    password: ''
})

// loading
const isSubmitting = ref(false);
const { notify } = useToast();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const validateForm = () => {
    let isValid = true
    formDataError.email = ''
    formDataError.password = ''

    if (formData.email.trim() === '') {
        formDataError.email = "Email is required"
        isValid = false
    } else if (!emailPattern.test(formData.email)) {
        formDataError.email = "Enter Email*"
        isValid = false
    }
    if (formData.password === '') {
        formDataError.password = "Enter Password*"
        isValid = false
    }
    // else if (formData.password.length < 8) {
    //     formDataError.password = "Password must be at least 8 characters"
    //     isValid = false
    // }
    return isValid
}

async function submitForm() {
    if (!validateForm()) return;

    isSubmitting.value = true;

    try {
        const response = await api.post(
            `/api/v1/users/login`,
            {
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            },
            { withCredentials: true }
        );

        setUser(response.data.data.user);
        notify("Login successful", "green");
        const redirect = typeof route.query.redirect === "string" && route.query.redirect.startsWith("/") && !route.query.redirect.startsWith("//")
            ? route.query.redirect
            : "/dashboard";
        await router.push(redirect);

    } catch (error) {
        const status = error.response?.status;
        const message =
            status === 401 || status === 404
                ? "Email or password is incorrect"
                : error.response?.data?.message || "Could not connect to the server";

        notify(message, "red");
    } finally {
        isSubmitting.value = false;
    }
}

</script>

<template>
    <AuthLayout>
        <main class="flex justify-center items-center min-h-screen py-8">
            <form @submit.prevent="submitForm"
                class="flex flex-col gap-4 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
                <div class="flex flex-col gap-1">
                    <BaseInput v-model="formData.email" placeholder="Enter Your Email" label="Email" type="email">
                        <Envelope class="h-4 w-4" />
                    </BaseInput>
                    <p v-if="formDataError.email" class="text-sm text-red-500 font-bold italic">
                        {{ formDataError.email }}
                    </p>
                </div>
                <div class="flex flex-col gap-1">
                    <BaseInput v-model="formData.password" placeholder="Enter Your Password" label="Password"
                        type="password">
                        <Lock class="h-4 w-4" />
                    </BaseInput>
                    <p v-if="formDataError.password" class="text-sm text-red-500 font-bold italic">
                        {{ formDataError.password }}
                    </p>
                </div>
                <!-- <button class="bg-blue-500 text-white p-2 rounded">REGISTER</button> -->
                <BaseButton :text="isSubmitting ? 'SIGNING IN...' : 'LOG IN'" type="submit" :disabled="isSubmitting" />
                <!-- </BaseButton> -->
            </form>
        </main>
    </AuthLayout>
</template>

<style scoped></style>