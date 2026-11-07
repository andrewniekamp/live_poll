<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import CreatePoll from "./CreatePoll.vue";

interface Poll {
  id: string;
  question: string;
  closed: boolean;
  totalVotes: number;
  options: { id: string; text: string; votes: number }[];
}

defineProps<{ admin?: boolean }>(); // UI-only: not a security check
const poll = ref<Poll>();
const error = ref("");

// One id per tab (kept across reloads), so several tabs act as different voters.
const participantId =
  sessionStorage.getItem("participantId") ?? crypto.randomUUID();
sessionStorage.setItem("participantId", participantId);

// Live updates: the server pushes new results after every vote or close.
let events: EventSource | undefined;
onUnmounted(() => events?.close());

// Load the current poll and listen for its updates.
async function load() {
  const res = await fetch("/api/polls/current");
  poll.value = res.ok ? await res.json() : undefined;
  events?.close();
  if (!poll.value) return;
  events = new EventSource(`/api/polls/${poll.value.id}/stream`);
  events.onmessage = (e) => (poll.value = JSON.parse(e.data));
}

// Vote or close; the API returns the latest results (or an error message).
async function post(path: string, body: object) {
  const res = await fetch(`/api/polls/${poll.value!.id}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.ok) poll.value = data;
  error.value = res.ok ? "" : String(data.message);
}

load();
</script>

<template>
  <p v-if="error">{{ error }}</p>
  <p v-if="!poll">No poll yet.</p>
  <div v-else>
    <h1>{{ poll.question }}</h1>
    <p v-if="poll.closed"><strong>Poll closed: final results</strong></p>
    <p v-for="o in poll.options" :key="o.id">
      <button
        v-if="!admin"
        :disabled="poll.closed"
        @click="post('/votes', { participantId, optionId: o.id })"
      >
        {{ o.text }}
      </button>
      <span v-else>{{ o.text }}:</span>
      {{ o.votes }} votes
    </p>
    <p>Total: {{ poll.totalVotes }}</p>
    <button v-if="admin && !poll.closed" @click="post('/close', {})">
      Close poll
    </button>
  </div>
  <CreatePoll v-if="admin && (!poll || poll.closed)" @created="load" />
</template>
