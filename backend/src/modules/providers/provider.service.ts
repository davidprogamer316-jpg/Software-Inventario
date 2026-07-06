import { Provider, IProvider } from './provider.model.js'

export async function listProviders(search?: string) {
  const query: Record<string, unknown> = { active: true }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { contactName: { $regex: search, $options: 'i' } },
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
  const provider = await Provider.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  if (!provider) throw { status: 404, message: 'Proveedor no encontrado' }
  return provider
}
