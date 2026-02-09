export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pagado': return 'bg-green-500 text-white border-green-500'
    case 'pendiente': return 'bg-yellow-400 text-white border-yellow-400'
    case 'parcial': return 'bg-orange-500 text-white border-orange-500'
    case 'confirmado': return 'bg-blue-500 text-white border-blue-500'
    default: return 'bg-slate-100 text-slate-700'
  }
}

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pagado': return 'Pagado'
    case 'pendiente': return 'Pendiente'
    case 'parcial': return 'Parcial'
    case 'confirmado': return 'Confirmado'
    default: return status
  }
}
