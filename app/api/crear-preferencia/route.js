import { MercadoPagoConfig, Preference } from 'mercadopago'
import { supabaseAdmin } from '@/lib/supabase'
import { publicAppBaseUrl } from '@/lib/public-app-url'

function copEntero(n) {
  return Math.round(Number(n))
}

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
      rifa_id: rifaIdBody
    } = body

    if (!participante_id || !email) {
      return Response.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    const { data: participante, error: partError } = await supabaseAdmin
      .from('participantes')
      .select('id, rifa_id, cantidad_boletos, total_pagado, nombre, email, estado_pago')
      .eq('id', participante_id)
      .single()

    if (partError || !participante) {
      return Response.json({ error: 'Participante no encontrado' }, { status: 404 })
    }

    if (participante.estado_pago !== 'pendiente') {
      return Response.json(
        { error: 'Este registro ya no está pendiente de pago' },
        { status: 400 }
      )
    }

    if (rifaIdBody && rifaIdBody !== participante.rifa_id) {
      return Response.json({ error: 'Rifa no coincide con el participante' }, { status: 400 })
    }

    if (participante.email?.trim().toLowerCase() !== String(email).trim().toLowerCase()) {
      return Response.json({ error: 'El email no coincide con el registro' }, { status: 400 })
    }

    const { data: rifa, error: rifaError } = await supabaseAdmin
      .from('rifas')
      .select('nombre, precio_boleto')
      .eq('id', participante.rifa_id)
      .single()

    if (rifaError || !rifa) {
      return Response.json({ error: 'Rifa no encontrada' }, { status: 404 })
    }

    const qty = participante.cantidad_boletos ?? 0
    const precio = copEntero(rifa.precio_boleto)
    const esperado = copEntero(qty * precio)

    if (qty < 1 || esperado < 1) {
      return Response.json({ error: 'Cantidad o precio inválido' }, { status: 400 })
    }

    const montoCliente = copEntero(monto)
    const totalGuardado = copEntero(participante.total_pagado)

    if (montoCliente !== esperado || totalGuardado !== esperado) {
      return Response.json(
        { error: 'El monto no coincide con el precio de la rifa' },
        { status: 400 }
      )
    }

    if (cantidad != null && copEntero(cantidad) !== copEntero(qty)) {
      return Response.json(
        { error: 'La cantidad no coincide con el registro' },
        { status: 400 }
      )
    }

    const preference = new Preference(client)
    const baseUrl = publicAppBaseUrl()

    const response = await preference.create({
      body: {
        items: [
          {
            title: `RIFEX — ${rifa.nombre} (${qty} ticket${qty > 1 ? 's' : ''})`,
            quantity: 1,
            unit_price: esperado,
            currency_id: 'COP'
          }
        ],
        payer: {
          name: nombre || participante.nombre,
          email: email
        },
        external_reference: participante_id,
        back_urls: {
          success: `${baseUrl}/confirmacion?participante=${participante_id}`,
          failure: `${baseUrl}/formulario`,
          pending: `${baseUrl}/confirmacion?participante=${participante_id}`
        },
        notification_url: `${baseUrl}/api/webhooks/mercadopago?source_news=webhooks`,
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
