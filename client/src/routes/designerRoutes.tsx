import DesignJob from '@/pages/designer/DesignJob';
import DesignHistory from '@/pages/designer/DesignHistory';

export const designerRoutes = [
  {
    path: 'design/jobs',
    element: <DesignJob />,
    roles: ['admin', 'desainer']
  },
  {
    path: 'design/history',
    element: <DesignHistory />,
    roles: ['admin', 'desainer']
  }
];