<script setup>
import { Envelope, Phone, Linkedin } from '@primeicons/vue';
</script>

<template>
    <main class="flex flex-row w-full h-screen p-6 items-center justify-center gap-8">
        <div class="w-1/2">
            <img src="https://images.unsplash.com/photo-1626863905121-3b0c0ed7b94c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" alt="">
        </div>
        <div> 
            <div class="flex flex-col gap-4">
                <h1 class="px-20 py-2 bg-gray-950 text-white text-5xl whitespace-nowrap">CONTACT US</h1>
                <p class=" text-2xl">We would love to hear from you!</p>
                <div class="flex flex-row gap-2 items-center">
                    <Envelope class="w-5 h-5" color="#708090"/>:
                    <p class="text-blue-500 font-bold cursor-pointer italic">support@ecommerce.com</p>
                </div>
                <div class="flex flex-row gap-2 items-center">
                    <Phone class="w-5 h-5" color="#708090"/>:
                    <p class="font-bold">+1 (123) 456-7890</p>
                </div>
                <div class="flex flex-row, gap-2 items-center">
                    <Linkedin class="w-5 h-5" color="slateblue"/>:
                    <p class="text-blue-500 font-bold cursor-pointer italic">linkedin.com/company/ecommerce</p>
                </div>
            </div>
        </div>
    </main>
    
</template>