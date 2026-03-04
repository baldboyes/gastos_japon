export type DirectusStatus = 'draft' | 'published' | 'archived'

export interface DirectusBaseFields {
  id: number | string
  status?: DirectusStatus | string
  user_created?: string | null
  date_created?: string | null
  user_updated?: string | null
  date_updated?: string | null
}

export type CurrencyCode = 'JPY' | 'EUR' | 'USD' | 'CNY' | 'KRW' | string

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'entertainment'
  | 'shopping'
  | 'other'

export type PaymentMethod = 'cash' | 'card' | 'ic'

export interface GeoLocation {
  address?: string | null
  latitude: number
  longitude: number
  city?: string | null
  prefecture?: string | null
}

export type PaymentStatus = 'paid' | 'pending' | 'partial'

export interface Trip extends DirectusBaseFields {
  name: string
  cover_image?: string | null
  start_date: string
  end_date?: string | null
  daily_budget?: number | null
  currency?: CurrencyCode | null
}

export interface FlightSegment {
  origin: string
  origin_terminal?: string | null
  destination: string
  destination_terminal?: string | null
  airline: string
  flight_number?: string | null
  departure_at: string
  arrival_at: string
  notes?: string | null
}

export interface Flight extends DirectusBaseFields {
  trip_id: number | string
  title?: string | null
  segments?: FlightSegment[] | null
  booking_code?: string | null
  price?: number | null
  currency?: CurrencyCode | null
  payment_status?: PaymentStatus | null
  attachments?: unknown[] | null
  departure_at?: string | null
  arrival_at?: string | null
  origin?: string | null
  destination?: string | null
  airline?: string | null
  flight_number?: string | null
}

export type MealPlan =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'full_board'
  | string

export interface Accommodation extends DirectusBaseFields {
  trip_id: number | string
  name: string
  address?: string | null
  check_in?: string | null
  check_out?: string | null
  price?: number | null
  currency?: CurrencyCode | null
  payment_status?: PaymentStatus | null
  notes?: string | null
  attachments?: unknown[] | null
  booking_code?: string | null
  google_maps_link?: string | null
  city?: string | null
  prefecture?: string | null
  latitude?: number | null
  longitude?: number | null
  location?: GeoLocation | null
  meal_plan?: MealPlan[] | null
  has_private_bathroom?: boolean | null
  phone?: string | null
  email?: string | null
  has_luggage_transfer?: boolean | null
}

export type ActivityType = 'museum' | 'park' | 'event' | 'other' | string

export interface Activity extends DirectusBaseFields {
  trip_id: number | string
  name: string
  start_date?: string | null
  end_date?: string | null
  type?: ActivityType | null
  price?: number | null
  currency?: CurrencyCode | null
  payment_status?: PaymentStatus | null
  notes?: string | null
  google_maps_link?: string | null
  attachments?: unknown[] | null
  location?: GeoLocation | null
}

export interface TransportSegment {
  origin: string
  destination: string
  mode: string
  departure_at: string
  arrival_at: string
  notes?: string | null
}

export type TransportCategory = 'pass' | 'route' | string
export type DurationType = 'days' | 'hours' | string

export interface Transport extends DirectusBaseFields {
  trip_id: number | string
  name: string
  category: TransportCategory
  start_date?: string | null
  end_date?: string | null
  segments?: TransportSegment[] | null
  price?: number | null
  currency?: CurrencyCode | null
  payment_status?: PaymentStatus | null
  attachments?: unknown[] | null
  pass_id?: number | string | null
  pass_title?: string | null
  duration_type?: DurationType | null
  notes?: string | null
  origin?: string | null
  destination?: string | null
  mode?: string | null
}

export type InsuranceType = 'health' | 'cancellation' | 'comprehensive' | string

export interface Insurance extends DirectusBaseFields {
  trip_id: number | string
  company: string
  type: InsuranceType
  policy_number?: string | null
  emergency_phone?: string | null
  emergency_email?: string | null
  start_date?: string | null
  end_date?: string | null
  price?: number | null
  currency?: CurrencyCode | null
  payment_status?: PaymentStatus | null
  attachments?: unknown[] | null
  notes?: string | null
}

export type ExpenseState = 'real' | 'planned' | string

export interface Expense extends DirectusBaseFields {
  trip_id: number | string
  date: string
  concept: string
  amount: number
  category: ExpenseCategory | string
  description?: string | null
  notes?: string | null
  payment_method?: PaymentMethod | string | null
  is_shared: boolean
  external_id?: string | null
  city?: string | null
  prefecture?: string | null
  location_lat?: number | null
  location_lng?: number | null
  currency?: CurrencyCode | null
  state?: ExpenseState | null
}

export type WalletDestinationFund = 'cash' | 'card' | 'ic' | string

export interface CurrencyExchange extends DirectusBaseFields {
  trip_id: number | string
  date: string
  source_amount: number
  target_amount: number
  exchange_rate?: number | null
  place?: string | null
  destination_fund: WalletDestinationFund
}

export interface DailyNote extends DirectusBaseFields {
  trip_id: number | string
  date: string
  content: string
}

export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'invite' | string

export interface Notification extends DirectusBaseFields {
  recipient_id: string
  title: string
  message: string
  type: NotificationType
  read_at?: string | null
  action_link?: string | null
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | string
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | string
export type TaskEntityType =
  | 'trip'
  | 'flight'
  | 'accommodation'
  | 'insurance'
  | 'activity'
  | 'transport'
  | 'expense'
  | string

export interface Task extends DirectusBaseFields {
  task_group?: number | string | null
  title: string
  description?: string | null
  due_date?: string | null
  priority: TaskPriority
  status: TaskStatus
  assigned_to?: string | null
  entity_type?: TaskEntityType | null
  entity_id?: number | string | null
  completed_at?: string | null
  completed_by?: string | null
}

export type Schema = {
  activities: Activity[]
  accommodations: Accommodation[]
  currency_exchanges: CurrencyExchange[]
  expenses: Expense[]
  daily_notes: DailyNote[]
  notifications: Notification[]
  insurances: Insurance[]
  transports: Transport[]
  trips: Trip[]
  flights: Flight[]
  tasks: Task[]
}

