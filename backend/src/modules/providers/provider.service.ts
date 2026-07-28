import { Provider, IProvider } from './provider.model.js'
import { escapeRegex } from '../../utils/escapeRegex.js'

export async function listProviders(search?: string) {
  const query: Record<string, unknown> = { active: true }
  if (search) {
    const safe = escapeRegex(search)
    query.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { contactName: { $regex: safe, $options: 'i' } },
    ]
  }
  return Provider.find(query).sort({ name: 1 })
}

export async function getProviderById(id: string) {
  const provider = await Provider.findById(id)
  if (!provider) throw { status: 404, message: 'Proveedor no encontrado' }
  return provider
}

export async function createProvider(data: Partial<IProvider>) {
  const provider = new Provider(data)
  return provider.save()
}

export async function updateProvider(id: string, data: Partial<IProvider>) {
  const allowed = (({ name, contactName, phone, email, address, notes, paymentMethod, paymentDetails, active }) =>
    ({ name, contactName, phone, email, address, notes, paymentMethod, paymentDetails, active }))(data)

  const provider = await Provider.findByIdAndUpdate(id, allowed, { new: true, runValidators: true })
  if (!provider) throw { status: 404, message: 'Proveedor no encontrado' }
  return provider
}
