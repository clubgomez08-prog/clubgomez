import { MercadoPagoConfig, Preference } from 'mercadopago'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    return Response.json(
      { error: 'Configuración de pagos no disponible' },
      { status: 500 }
    )
  }
  const client = new MercadoPagoConfig({ accessToken })

  try {
    const body = await request.json()
    const {
      participante_id,
      cantidad,
      monto,
      nombre,
      email,
      rifa_id
    } = body

    if (!participante_id || !cantidad || !monto || !email) {
      return Response.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Obtener datos de la rifa
    const { data: rifa, error: rifaError } = await supabaseAdmin
      .from('rifas')
      .select('nombre, precio_boleto')
      .eq('id', rifa_id)
      .single()

    if (rifaError || !rifa) {
      return Response.json(
        { error: 'Rifa no encontrada' },
        { status: 404 }
      )
    }

    const preference = new Preference(client)

    const response = await preference.create({
      body: {
        items: [
          {
            title: `RIFEX — ${rifa.nombre} (${cantidad} ticket${cantidad > 1 ? 's' : ''})`,
            quantity: 1,
            unit_price: monto,
            currency_id: 'COP'
          }
        ],
        payer: {
          name: nombre,
          email: email
        },
        external_reference: participante_id,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rifas-sistema.vercel.app'}/confirmacion?participante=${participante_id}`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rifas-sistema.vercel.app'}/formulario`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rifas-sistema.vercel.app'}/confirmacion?participante=${participante_id}`
        },
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rifas-sistema.vercel.app'}/api/webhooks/mercadopago`,
        auto_return: 'approved'
      }
    })

    return Response.json({
      init_point: response.init_point || response.sandbox_init_point,
      preference_id: response.id
    })

  } catch (error) {
    console.error('[crear-preferencia] Error:', error?.message || 'Error desconocido')
    return Response.json(
      { error: 'Error al crear preferencia de pago' },
      { status: 500 }
    )
  }
}
