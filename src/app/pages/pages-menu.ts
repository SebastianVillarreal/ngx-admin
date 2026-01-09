import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'E-commerce',
    icon: 'shopping-cart-outline',
    link: '/pages/dashboard',
    home: true,
  },
    {
    title: 'IoT Dashboard',
    icon: 'home-outline',
    link: '/pages/iot-dashboard',
  },
  {
    title: 'Catalogos',
    icon: 'settings-2-outline',
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
        title: 'Médicos',
        link: '/pages/catalogos/medicos',
      },
      {
        title: 'Sucursales',
        link: '/pages/sistemas/solicitud-de-etiquets',
      },
    ],
  },
  {
    title: 'Compras',
    icon: 'shopping-bag-outline',
    children: [
      {
        title: 'Artículos',
        link: '/pages/compras/articulos',
      },
      {
        title: 'Cotizaciones',
        link: '/pages/compras/cotizaciones',
        children: [
          {
            title: 'Nueva cotización',
            link: '/pages/compras/cotizaciones',
          },
          {
            title: 'Lista de cotizaciones',
            link: '/pages/compras/cotizaciones/lista',
          },
        ],
      },
      {
        title: 'Proveedores',
        link: '/pages/compras/proveedores',
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
    icon: 'settings-2-outline',
    children: [
      {
        title: 'Entradas',
        link: '/pages/sistemas/entradas',
      },
      {
        title: 'Ofertas',
        link: '/pages/sistemas/ofertas',
      },
      {
        title: 'Solicitud de etiquets',
        link: '/pages/sistemas/solicitud-de-etiquets',
      },
    ],
  },
  {
    title: 'Cuentas por cobrar',
    icon: 'settings-2-outline',
    children: [
      {
        title: 'Clientes',
        link: '/pages/cuentas-por-cobrar/clientes',
      },
      {
        title: 'Separados',
        link: '/pages/cuentas-por-cobrar/clientes',
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
            title: 'Folios Pagos',
            link: '/pages/cuentas-por-cobrar/creditos/folios-pagos',
          },
          {
            title: 'Corte Abonos',
            link: '/pages/cuentas-por-cobrar/creditos/corte-abonos',
          },
          {
            title: 'Historico',
            link: '/pages/cuentas-por-cobrar/creditos/historico',
          },
        ],
      },
      
    ],
  },
  {
    title: 'Inventarios',
    icon: 'settings-2-outline',
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
            title: 'Histórico',
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
        ]
      },
      {
        title: 'Verificador',
        link: '/pages/inventarios/verificador',
      },
      {
        title: 'Importar físicos',
        link: '/pages/inventarios/importar-fisicos',
      },
      {
        title: 'Reparto de mermas(Maqueta)',
        link: '/pages/inventarios/reparto-mermas',
      },
      {
        title: 'Existencias',
        link: '/pages/inventarios/existencias'
      },
      
    ],
  },

  
  {
    title: 'FEATURES',
    group: true,
  },

  {
    title: 'Maps',
    icon: 'map-outline',
    children: [
      {
        title: 'Google Maps',
        link: '/pages/maps/gmaps',
      },
      {
        title: 'Leaflet Maps',
        link: '/pages/maps/leaflet',
      },
      {
        title: 'Bubble Maps',
        link: '/pages/maps/bubble',
      },
      {
        title: 'Search Maps',
        link: '/pages/maps/searchmap',
      },
    ],
  },
  {
    title: 'Charts',
    icon: 'pie-chart-outline',
    children: [
      {
        title: 'Echarts',
        link: '/pages/charts/echarts',
      },
      {
        title: 'Charts.js',
        link: '/pages/charts/chartjs',
      },
      {
        title: 'D3',
        link: '/pages/charts/d3',
      },
    ],
  },


  {
    title: 'Auth',
    icon: 'lock-outline',
    children: [
      {
        title: 'Login',
        link: '/auth/login',
      },
      {
        title: 'Register',
        link: '/auth/register',
      },
      {
        title: 'Request Password',
        link: '/auth/request-password',
      },
      {
        title: 'Reset Password',
        link: '/auth/reset-password',
      },
    ],
  },
];
