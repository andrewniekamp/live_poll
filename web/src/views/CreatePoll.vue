<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{ created: [] }>();
const question = ref("");
const options = ref(["", "", "", "", ""]); // up to 5; blank ones are ignored
const error = ref("");

async function create() {
  const res = await fetch("/api/polls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: question.value,
      options: options.value.filter((o) => o),
    }),
  });
  const data = await res.json();
  if (res.ok) emit("created");
  else error.value = String(data.message);
}
</script>

<template>
  <h2>New poll</h2>
  <form @submit.prevent="create">
    <p><input v-model="question" placeholder="Question" /></p>
    <p v-for="(_, i) in options" :key="i">
      <input v-model="options[i]" :placeholder="`Option ${i + 1}`" />
    </p>
    <button>Create</button>
  </form>
  <p v-if="error">{{ error }}</p>
</template>
