// Components
import { VDefaultsProvider } from '@/components/VDefaultsProvider'
import { VExpandTransition } from '@/components/transitions'

// Composables
import { useList } from './list'
import { IconValue } from '@/composables/icons'
import { makeTagProps } from '@/composables/tag'
import { useNestedGroupActivator, useNestedItem } from '@/composables/nested/nested'

// Utilities
import { computed, toRef } from 'vue'
import { defineComponent, genericComponent, propsFactory, useRender } from '@/util'

export type VListGroupSlots = {
  default: []
  activator: [{ isOpen: boolean, props: Record<string, unknown> }]
}

const VListGroupActivator = defineComponent({
  name: 'VListGroupActivator',

  setup (_, { slots }) {
    useNestedGroupActivator()

    return () => slots.default?.()
  },
})

export const makeVListGroupProps = propsFactory({
  activeColor: String,
  color: String,
  collapseIcon: {
    type: IconValue,
    default: '$collapse',
  },
  expandIcon: {
    type: IconValue,
    default: '$expand',
  },
  prependIcon: IconValue,
  appendIcon: IconValue,
  fluid: Boolean,
  subgroup: Boolean,
  value: null,

  ...makeTagProps(),
}, 'v-list-group')

export const VListGroup = genericComponent<VListGroupSlots>()({
  name: 'VListGroup',

  props: {
    title: String,

    ...makeVListGroupProps(),
  },

  setup (props, { slots }) {
    const { isOpen, open, id: _id } = useNestedItem(toRef(props, 'value'), true)
    const id = computed(() => `v-list-group--id-${String(_id.value)}`)
    const list = useList()

    function onClick (e: Event) {
      open(!isOpen.value, e)
    }

    const activatorProps = computed(() => ({
      onClick,
      class: 'v-list-group__header',
      id: id.value,
    }))

    const toggleIcon = computed(() => isOpen.value ? props.collapseIcon : props.expandIcon)
    const activatorDefaults = computed(() => ({
      VListItem: {
        active: isOpen.value,
        activeColor: props.activeColor,
        color: props.color,
        prependIcon: props.prependIcon || (props.subgroup && toggleIcon.value),
        appendIcon: props.appendIcon || (!props.subgroup && toggleIcon.value),
        title: props.title,
        value: props.value,
      },
    }))

    useRender(() => (
      <props.tag
        class={[
          'v-list-group',
          {
            'v-list-group--prepend': list?.hasPrepend.value,
            'v-list-group--fluid': props.fluid,
            'v-list-group--subgroup': props.subgroup,
            'v-list-group--open': isOpen.value,
          },
        ]}
      >
        { slots.activator && (
          <VDefaultsProvider defaults={ activatorDefaults.value }>
            <VListGroupActivator>
              { slots.activator({ props: activatorProps.value, isOpen: isOpen.value }) }
            </VListGroupActivator>
          </VDefaultsProvider>
        )}

        <VExpandTransition>
          <div class="v-list-group__items" role="group" aria-labelledby={ id.value } v-show={ isOpen.value }>
            { slots.default?.() }
          </div>
        </VExpandTransition>
      </props.tag>
    ))

    return {}
  },
})

export type VListGroup = InstanceType<typeof VListGroup>
