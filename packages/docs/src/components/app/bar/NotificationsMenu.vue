<template>
  <app-menu
    v-model="menu"
    :close-on-content-click="false"
    :open-on-hover="false"
    :width="width"
  >
    <template #activator="{ props }">
      <app-tooltip-btn
        path="notifications"
        v-bind="props"
      >
        <template #icon>
          <v-badge
            :model-value="unread.length > 0"
            color="#ED561B"
            dot
            location="top end"
          >
            <v-icon
              :icon="icon"
              class="mx-1"
              color="medium-emphasis"
            />
          </v-badge>
        </template>
      </app-tooltip-btn>
    </template>

    <v-toolbar
      class="ps-4 pe-5"
      color="surface"
      density="compact"
    >
      <v-btn
        :disabled="showArchived ? unread.length < 1 : read.length < 1"
        class="px-2 ms-n1"
        size="small"
        variant="text"
        @click="showArchived = !showArchived"
      >
        {{ showArchived ? t('unread', { number: unread.length }) : t('read', { number: read.length }) }}
      </v-btn>
    </v-toolbar>

    <v-divider />

    <v-responsive
      class="overflow-y-auto"
      max-height="340"
    >
      <div
        v-if="done"
        class="py-8 text-center text-subtitle-1"
      >
        <p>{{ t('done') }}</p>

        <svg width="96" height="84" viewBox="0 0 495 436" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- eslint-disable-next-line max-len -->
          <path d="M129.795 228.936L123.336 217.498L0 0H246.617H259.591C259.591 0 259.591 0 259.591 0L129.796 228.936C129.796 228.936 129.796 228.936 129.796 228.935L129.795 228.936ZM306.937 0L153.497 270.686L246.617 434.996L369.954 217.498L493.234 0H306.937H306.937Z" fill="#D7D7D7" />
        </svg>

      </div>

      <template v-else>
        <v-list lines="three">
          <template
            v-for="(notification, i) in notifications"
            :key="notification.slug"
          >

            <v-divider
              v-if="i !== 0"
              class="my-1"
            />

            <v-list-item
              :ripple="false"
              class="py-2"
            >
              <v-list-item-title class="text-wrap text-h6 mb-1 text-truncate">
                <span>{{ notification.metadata.emoji }}</span>

                <span class="ps-3"> {{ notification.title }}</span>
              </v-list-item-title>

              <div class="text-caption text-medium-emphasis ps-10">
                {{ notification.metadata.text }}

                <app-link :href="notification.metadata.action">
                  {{ notification.metadata.action_text }}
                </app-link>
              </div>

              <template #append>
                <v-btn
                  :ripple="false"
                  :icon="marked.icon"
                  class="ms-3"
                  color="medium-emphasis"
                  variant="text"
                  @click.stop.prevent="toggle(notification)"
                />
              </template>
            </v-list-item>
          </template>
        </v-list>
      </template>
    </v-responsive>
  </app-menu>
</template>

<script setup lang="ts">
  // Components
  import AppTooltipBtn from '@/components/app/TooltipBtn.vue'

  // Composables
  import { useCosmic } from '@/composables/cosmic'
  import { useDisplay } from 'vuetify'
  import { useI18n } from 'vue-i18n'
  import { useUserStore } from '@/store/user'

  // Utilities
  import { computed, onMounted, ref } from 'vue'

  // Types
  interface Notification {
    metadata: {
      action: string
      action_text: string
      emoji: string
      text: string
    }
    // eslint-disable-next-line camelcase
    created_at: string
    slug: string
    title: string
  }

  const { t } = useI18n()
  const { bucket } = useCosmic<Notification>()
  const { mobile } = useDisplay()
  const user = useUserStore()
  const menu = ref(false)
  const all = ref<Notification[]>([])
  const showArchived = ref(false)

  const unread = computed(() => all.value.filter(({ slug }) => !user.notifications.read.includes(slug)))
  const read = computed(() => all.value.filter(({ slug }) => user.notifications.read.includes(slug)))
  const notifications = computed(() => showArchived.value ? read.value : unread.value)
  const done = computed(() => {
    return (
      showArchived.value && read.value.length < 1
    ) || (
      !showArchived.value && unread.value.length < 1
    )
  })

  const marked = computed(() => {
    const path = showArchived.value ? 'unread' : 'read'
    const icon = showArchived.value ? 'mdi-email-mark-as-unread' : 'mdi-email-open'

    return { icon, path }
  })
  const icon = computed(() => {
    if (menu.value && unread.value.length > 0) return 'mdi-bell-ring'
    else if (menu.value) return 'mdi-bell'
    else if (unread.value.length > 0) return 'mdi-bell-ring-outline'
    else return 'mdi-bell-outline'
  })

  const width = computed(() => mobile.value ? 420 : 520)

  function toggle ({ slug }: Notification) {
    user.notifications.read = user.notifications.read.includes(slug)
      ? user.notifications.read.filter(n => n !== slug)
      : [...user.notifications.read, slug]
  }

  onMounted(async () => {
    if (all.value.length) return

    const { objects = [] } = (
      await bucket?.objects
        .find({ type: 'notifications' })
        .props('created_at,metadata,slug,title')
        .status('published')
        .sort('-created_at')
        .limit(5)
    ) || {}

    all.value = objects
  })
</script>
