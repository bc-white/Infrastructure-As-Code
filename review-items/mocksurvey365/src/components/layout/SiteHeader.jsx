import React from "react";
import { Bell, ChevronDown } from "lucide-react";
import { useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { getRouteMetadata } from "../../lib/route-utils";

const SiteHeader = ({ user, onNotificationClick }) => {
  const location = useLocation();
  const { title, subheading, breadcrumbs } = getRouteMetadata(location.pathname);
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href || index}>
                  <BreadcrumbItem>
                    {crumb.href ? (
                      <BreadcrumbLink to={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* Title Section */}
        {!breadcrumbs && (
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {subheading && (
              <p className="text-sm text-gray-600 mt-1">{subheading}</p>
            )}
          </div>
        )}

        {/* Right Section */}
        <div className="ml-auto flex items-center gap-4">
          {/* Notifications */}
          <button
            onClick={onNotificationClick}
            className="relative rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {/* Notification badge - can be conditionally shown */}
            {/* <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></span> */}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 transition-colors">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.email}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader ;
