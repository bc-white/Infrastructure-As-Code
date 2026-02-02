import { Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface NoResultProps {
    title: string;
    description: string;
    buttonText: string;
    onClearFilters: () => void;
}

const NoResult: React.FC<NoResultProps> = ({ title, description, buttonText, onClearFilters }) => {
    return (
        <Card className="py-12 text-center shadow-sm">
            <CardContent>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {title}
              </h3>
              <p className="mb-4 text-gray-600">
                {description}
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  onClearFilters();
                }}
              >
                 {buttonText}
              </Button>
            </CardContent>
          </Card>
    );
};

export default NoResult;

