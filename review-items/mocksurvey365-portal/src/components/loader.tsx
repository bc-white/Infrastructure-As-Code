import { Users } from "lucide-react";
import type { ReactNode } from "react";

interface LoaderProps {
    title: string;
    description: string;
    icon?: ReactNode; 
}

const Loader: React.FC<LoaderProps> = ({ title, description, icon }) => {
    return (
        <div className="min-h-screen bg-gray-50/10 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
            {icon ?? <Users className="h-6 w-6 text-blue-600" />}
            </div>
          </div>
          <h3 className="mt-6 text-lg font-medium text-gray-900">
            {title}
          </h3>
          <p className="mt-2 text-gray-600">
            {description}
          </p>
        </div>
      </div>
    );
};

export default Loader;