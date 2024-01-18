import { ShieldVaultLayout } from '../layout';
import { Router } from '@remix-run/router';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { RouteKey } from '../../../constant/routes';
import { prefixPath } from '../../common/utils/location-wrapper';
import { Bridge } from '../pages/bridge/bridge';
import { NotFound } from '../pages/404';

const router: Router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={prefixPath} />,
  },
  {
    path: prefixPath,
    element: <ShieldVaultLayout />,
    children: [
      { path: RouteKey.bridge, element: <Bridge /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

const elements = (
  <>
    <RouterProvider router={router} />
  </>
);

export default elements;
