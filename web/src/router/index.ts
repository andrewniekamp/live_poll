import { createRouter, createWebHistory } from 'vue-router'
import PollView from '../views/PollView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: PollView }, // voters
    { path: '/admin', component: PollView, props: { admin: true } }, // facilitator
  ],
})

export default router
