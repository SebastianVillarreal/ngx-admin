import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'Inicio',
    icon: 'home-outline',
    link: '/pages/home',
    home: true,
  },
  {
    title: 'Catalogos',
    icon: 'grid-outline',
    children: [
      {
        title: 'Familias',
        link: '/pages/catalogos/familias',
      },
      {
        title: 'Departamentos',
        link: '/pages/catalogos/departamentos',
      },
      {
        title: 'Medicos',
        link: '/pages/catalogos/medicos',
      },
      {
        title: 'Sucursales',
        link: '/pages/sistemas/solicitud-de-etiquetas',
      },
    ],
  },
  {
    title: 'Compras',
    icon: 'shopping-bag-outline',
    children: [
      {
        title: 'Articulos',
        link: '/pages/compras/articulos',
        children: [
          {
            title: 'Lista',
            link: '/pages/compras/articulos',
          },
          {
            title: 'Cambios de precio',
            link: '/pages/compras/articulos/cambios-precio',
          },
        ],
      },
      {
        title: 'Cotizaciones',
        link: '/pages/compras/cotizaciones',
        children: [
          {
            title: 'Nueva cotizacion',
            link: '/pages/compras/cotizaciones',
          },
          {
            title: 'Lista de cotizaciones',
            link: '/pages/compras/cotizaciones/lista',
          },
          {
            title: 'Pedido sugerido',
            link: '/pages/compras/cotizaciones/pedido-sugerido',
          },
        ],
      },
      {
        title: 'Proveedores',
        link: '/pages/compras/proveedores',
        children: [
          {
            title: 'Catalogo',
            link: '/pages/compras/proveedores',
          },
          {
            title: 'Listas de precios',
            link: '/pages/compras/proveedores/listas-precios',
          },
        ],
      },
      {
        title: 'Margenes familias',
        link: '/pages/compras/margenes-familias',
      },
      {
        title: 'Precios programados',
        link: '/pages/compras/precios-programados',
      },
    ],
  },
  {
    title: 'Recibo',
    icon: 'file-text-outline',
    children: [
      {
        title: 'Libro diario',
        link: '/pages/recibo/libro-diario',
      },
    ],
  },
  {
    title: 'Sistemas',
    icon: 'monitor-outline',
    children: [
      {
        title: 'Entradas',
        link: '/pages/sistemas/entradas',
      },
      {
        title: 'Ofertas',
        link: '/pages/sistemas/ofertas',
        children: [
          {
            title: 'Ofertas regulares',
            link: '/pages/sistemas/ofertas',
          },
          {
            title: 'Ofertas porcentaje',
            link: '/pages/sistemas/ofertas-porcentaje',
          },
        ],
      },
      {
        title: 'Solicitud de etiquetas',
        link: '/pages/sistemas/solicitud-de-etiquetas',
        children: [
          {
            title: 'Formulario de insercion',
            link: '/pages/sistemas/solicitud-de-etiquetas',
          },
          {
            title: 'Lista de solicitudes',
            link: '/pages/sistemas/solicitud-de-etiquetas/lista',
          },
        ],
      },
      {
        title: 'Depto Basculas',
        link: '/pages/sistemas/depto-basculas',
      },
    ],
  },
  {
    title: 'Cuentas por pagar',
    icon: 'credit-card-outline',
    children: [
      {
        title: 'Facturas',
        children: [
          {
            title: 'Remision a factura',
            link: '/pages/cuentas-por-pagar/facturas/remision-a-factura',
          },
        ],
      },
      {
        title: 'Pagos',
        children: [
          {
            title: 'Pagos Spei',
            link: '/pages/cuentas-por-pagar/pagos-spei',
          },
          {
            title: 'Historico pagos',
            link: '/pages/cuentas-por-pagar/pagos/historico-pagos',
          },
          {
            title: 'Verificador de pagos',
            link: '/pages/cuentas-por-pagar/pagos/verificador-pagos',
          },
          {
            title: 'Reportes',
            link: '/pages/cuentas-por-pagar/pagos/reportes/resumen-pagos',
            children: [
              {
                title: 'Resumen pagos',
                link: '/pages/cuentas-por-pagar/pagos/reportes/resumen-pagos',
              },
            ],
          },
        ],
      },
      {
        title: 'Notas de cargo',
        children: [
          {
            title: 'Insertar',
            link: '/pages/cuentas-por-pagar/notas-de-cargo/insertar',
          },
          {
            title: 'Lista',
            link: '/pages/cuentas-por-pagar/notas-de-cargo/lista',
          },
        ],
      },
    ],
  },
  {
    title: 'Cuentas por cobrar',
    icon: 'people-outline',
    children: [
      {
        title: 'Clientes',
        link: '/pages/cuentas-por-cobrar/clientes',
      },
      {
        title: 'Separados',
        link: '/pages/cuentas-por-cobrar/separados/existencias',
        children: [
          {
            title: 'Existencias',
            link: '/pages/cuentas-por-cobrar/separados/existencias',
          },
        ],
      },
      {
        title: 'Creditos',
        link: '/pages/cuentas-por-cobrar/creditos',
        children: [
          {
            title: 'Listado',
            link: '/pages/cuentas-por-cobrar/creditos',
          },
          {
            title: 'Folios pagos',
            link: '/pages/cuentas-por-cobrar/creditos/folios-pagos',
          },
          {
            title: 'Corte abonos',
            link: '/pages/cuentas-por-cobrar/creditos/corte-abonos',
          },
          {
            title: 'Historico',
            link: '/pages/cuentas-por-cobrar/creditos/historico',
          },
        ],
      },
      {
        title: 'Reportes',
        link: '/pages/cuentas-por-cobrar/reportes/estado-cuenta',
        children: [
          {
            title: 'Estado cuenta',
            link: '/pages/cuentas-por-cobrar/reportes/estado-cuenta',
          },
          {
            title: 'Estado cuenta periodo',
            link: '/pages/cuentas-por-cobrar/reportes/estado-cuenta-periodo',
          },
        ],
      },
    ],
  },
  {
    title: 'Inventarios',
    icon: 'archive-outline',
    children: [
      {
        title: 'Movimientos',
        link: '/pages/inventarios/movimientos',
        children: [
          {
            title: 'Registrar',
            link: '/pages/inventarios/movimientos',
          },
          {
            title: 'Editar y autorizar',
            link: '/pages/inventarios/movimientos/editar-autorizar',
          },
          {
            title: 'Historico',
            link: '/pages/inventarios/movimientos/historico',
          },
        ],
      },
      {
        title: 'Traspasos',
        link: '/pages/inventarios/traspasos',
        children: [
          {
            title: 'Crear traspaso',
            link: '/pages/inventarios/traspasos',
          },
          {
            title: 'Recibir traspasos',
            link: '/pages/inventarios/recibir-traspasos',
          },
          {
            title: 'Traspasos enviados',
            link: '/pages/inventarios/traspasos-enviados',
          },
          {
            title: 'En transito',
            link: '/pages/inventarios/traspasos-en-transito',
          },
          {
            title: 'Traspasos con diferencia',
            link: '/pages/inventarios/traspasos-con-diferencia',
          },
        ],
      },
      {
        title: 'Verificador',
        link: '/pages/inventarios/verificador',
      },
      {
        title: 'Importar fisicos',
        link: '/pages/inventarios/importar-fisicos',
      },
      {
        title: 'Existencias',
        link: '/pages/inventarios/existencias',
        children: [
          {
            title: 'Existencias',
            link: '/pages/inventarios/existencias',
          },
          {
            title: 'Historico existencias',
            link: '/pages/inventarios/existencias/historico-existencias',
          },
          {
            title: 'Existencias negativas',
            link: '/pages/inventarios/existencias/existencias-negativas',
          },
        ],
      },
    ],
  },
  {
    title: 'Punto Venta',
    icon: 'shopping-cart-outline',
    children: [
      {
        title: 'Aplicación',
        link: '/pages/punto-venta/aplicacion',
      },
      {
        title: 'Libro antibioticos',
        link: '/pages/punto-venta/libro-antibioticos',
      },
      {
        title: 'Codigos Kiosco',
        link: '/pages/punto-venta/codigos-kiosco',
      },
      {
        title: 'Reportes',
        link: '/pages/punto-venta/reportes/tickets',
        children: [
          {
            title: 'Tickets',
            link: '/pages/punto-venta/reportes/tickets',
          },
          {
            title: 'Devoluciones pagadas',
            link: '/pages/punto-venta/reportes/devoluciones-pagadas',
          },
          {
            title: 'Poliza de ingresos',
            link: '/pages/punto-venta/reportes/poliza-ingresos',
          },
          {
            title: 'Operaciones Cashback',
            link: '/pages/punto-venta/reportes/operaciones-cashback',
          },
        ],
      },
    ],
  },
];
