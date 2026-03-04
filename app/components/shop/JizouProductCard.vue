<script setup lang="ts">
import { tv, type VariantProps } from "tailwind-variants"
import { computed } from "vue"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency } from "@/utils/currency"

const card = tv({
  slots: {
    container: "rounded-xl",
    inner: "rounded-[inherit] overflow-hidden",
    image: "w-full aspect-[4/3] object-cover",
    body: "p-4 space-y-2",
    title: "text-base font-semibold leading-tight",
    price: "text-sm text-muted-foreground",
    actions: "mt-2",
  },
  variants: {
    variant: {
      default: {
        container: "border border-border bg-card text-card-foreground shadow-sm",
        inner: "bg-card",
      },
      promotional: {
        container: "p-[1px] bg-gradient-to-r from-pink-500 to-violet-500",
        inner: "bg-card text-card-foreground rounded-[inherit]",
      },
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

type CardVariants = VariantProps<typeof card>

interface Props {
  title: string
  price: number | string
  imageUrl?: string
  variant?: CardVariants["variant"]
  class?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  add: []
}>()

const styles = computed(() => card({ variant: props.variant }))
const displayPrice = computed(() =>
  typeof props.price === "number" ? formatCurrency(props.price) : String(props.price)
)

function onAdd() {
  emit("add")
}
</script>

<template>
  <div :class="cn(styles.container(), props.class)">
    <div :class="styles.inner()">
      <img v-if="imageUrl" :src="imageUrl" :alt="title" :class="styles.image()" />
      <div :class="styles.body()">
        <div :class="styles.title()">{{ title }}</div>
        <div :class="styles.price()">{{ displayPrice }}</div>
        <div :class="styles.actions()">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="default"
                  size="default"
                  aria-label="Añadir al carrito"
                  @click="onAdd"
                >
                  Añadir al carrito
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Añadir al carrito
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  </div>
</template>
