export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pagado': return 'bg-green-100 text-green-700 border-green-200'
    case 'pendiente': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'parcial': return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'confirmado': return 'bg-blue-100 text-blue-700 border-blue-200'
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
