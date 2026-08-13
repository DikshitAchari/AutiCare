import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center text-xs text-slate-500 mb-4 font-medium" aria-label="Breadcrumb">
      <Link to={`/${pathnames[0]}/dashboard`} className="hover:text-blue-600 flex items-center gap-1">
        <Home className="w-3.5 h-3.5" />
        <span className="capitalize">{pathnames[0]}</span>
      </Link>
      {pathnames.slice(1).map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 2).join('/')}`;
        const isLast = index === pathnames.length - 2;

        return (
          <React.Fragment key={name}>
            <ChevronRight className="w-3 h-3 mx-1.5 text-slate-300 shrink-0" />
            {isLast ? (
              <span className="text-slate-900 font-semibold capitalize">{name.replace(/-/g, ' ')}</span>
            ) : (
              <Link to={routeTo} className="hover:text-blue-600 capitalize">
                {name.replace(/-/g, ' ')}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
