<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useTripOrganizationNew } from '~/composables/useTripOrganizationNew'
import { useExpensesNew } from '~/composables/useExpensesNew'
import { useTripTasksNew } from '~/composables/useTripTasksNew'
import { useItineraryNew } from '~/composables/useItineraryNew'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import ItineraryDaysSwiper from '~/components/itinerary/ItineraryDaysSwiper.vue'
import ItineraryDayList from '~/components/itinerary/ItineraryDayList.vue'
import type { ExpenseCategory, PaymentMethod } from '~/types'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const tripId = route.params.id as string

const { fetchOrganizationData } = useTripOrganizationNew()
const { fetchExpenses, createExpense } = useExpensesNew()
const { fetchTasks } = useTripTasksNew()

const { 
  selectedDate, 
  initSelectedDate, 
  daysWithEvents, 
  selectedDayDetails,
  selectDate
} = useItineraryNew()

// Expense State
const isExpenseDialogOpen = ref(false)
const expenseForm = ref({
  date: new Date().toISOString().slice(0, 16),
  concept: '',
  amount: 0,
  category: 'food' as ExpenseCategory,
  notes: '',
  paymentMethod: 'cash' as PaymentMethod,
  shared: false,
  currency: 'JPY'
})

onMounted(async () => {
  const id = parseInt(tripId)
  await Promise.all([
    fetchOrganizationData(id),
    fetchExpenses(id),
    fetchTasks(id)
  ])
  initSelectedDate()
})

const handleCreateExpense = async () => {
  if (!expenseForm.value.concept || !expenseForm.value.amount) return
  try {
    const timestamp = new Date(expenseForm.value.date).toISOString().replace('T', ' ').slice(0, 16)
    
    await createExpense({
      timestamp: timestamp,
      placeName: expenseForm.value.concept,
      amount: Number(expenseForm.value.amount),
      category: expenseForm.value.category,
      notes: expenseForm.value.notes,
      location: {
          coordinates: { lat: 0, lng: 0 }, // Default location
          city: '',
          prefecture: ''
      },
      paymentMethod: expenseForm.value.paymentMethod,
      shared: expenseForm.value.shared,
      trip_id: parseInt(tripId),
      status: 'real'
    })
    
    isExpenseDialogOpen.value = false
    expenseForm.value = {
      date: new Date().toISOString().slice(0, 16),
      concept: '',
      amount: 0,
      category: 'food',
      notes: '',
      paymentMethod: 'cash',
      shared: false,
      currency: 'JPY'
    }
  } catch(e) { console.error(e) }
}
</script>

<template>
  <div>
    <ItineraryDaysSwiper 
      :days="daysWithEvents" 
      :selectedDate="selectedDate" 
      @select="selectDate"
    />
    <ItineraryDayList 
      :events="selectedDayDetails" 
      :date="selectedDate"
      :tripId="tripId"
      @create-expense="isExpenseDialogOpen = true"
    />
    <!-- Modal Nuevo Gasto -->
    <Dialog v-model:open="isExpenseDialogOpen">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
            <DialogTitle>{{ $t('trip_itinerary_page.expense_modal.title') }}</DialogTitle>
            <DialogDescription>{{ $t('trip_itinerary_page.expense_modal.description') }}</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
              <div class="grid gap-2">
              <Label>{{ $t('trip_itinerary_page.expense_modal.fields.date') }}</Label><Input type="datetime-local" v-model="expenseForm.date" />
              </div>
              <div class="grid gap-2">
              <Label>{{ $t('trip_itinerary_page.expense_modal.fields.amount') }}</Label><Input type="number" v-model="expenseForm.amount" />
              </div>
          </div>
          <div><Label>{{ $t('trip_itinerary_page.expense_modal.fields.concept') }}</Label><Input v-model="expenseForm.concept" /></div>
          <div class="grid grid-cols-2 gap-4">
              <div>
                  <Label>{{ $t('trip_itinerary_page.expense_modal.fields.category') }}</Label>
                  <Select v-model="expenseForm.category">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="food">{{ $t('trip_itinerary_page.expense_modal.category.food') }}</SelectItem>
                          <SelectItem value="transport">{{ $t('trip_itinerary_page.expense_modal.category.transport') }}</SelectItem>
                          <SelectItem value="accommodation">{{ $t('trip_itinerary_page.expense_modal.category.accommodation') }}</SelectItem>
                          <SelectItem value="shopping">{{ $t('trip_itinerary_page.expense_modal.category.shopping') }}</SelectItem>
                          <SelectItem value="entertainment">{{ $t('trip_itinerary_page.expense_modal.category.entertainment') }}</SelectItem>
                          <SelectItem value="other">{{ $t('trip_itinerary_page.expense_modal.category.other') }}</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div>
              <Label>{{ $t('trip_itinerary_page.expense_modal.fields.payment_method') }}</Label>
              <Select v-model="expenseForm.paymentMethod">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="cash">{{ $t('trip_itinerary_page.expense_modal.payment.cash') }}</SelectItem>
                      <SelectItem value="card">{{ $t('trip_itinerary_page.expense_modal.payment.card') }}</SelectItem>
                      <SelectItem value="ic">{{ $t('trip_itinerary_page.expense_modal.payment.ic') }}</SelectItem>
                  </SelectContent>
              </Select>
              </div>
          </div>
          <div>
            <Label>{{ $t('trip_itinerary_page.expense_modal.fields.notes') }}</Label>
            <Textarea v-model="expenseForm.notes" />
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox :checked="expenseForm.shared" @update:checked="expenseForm.shared = $event" />
            <Label>{{ $t('trip_itinerary_page.expense_modal.fields.shared') }}</Label>
          </div>
        </div>
        <DialogFooter>
            <Button @click="handleCreateExpense">{{ $t('trip_itinerary_page.expense_modal.actions.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
