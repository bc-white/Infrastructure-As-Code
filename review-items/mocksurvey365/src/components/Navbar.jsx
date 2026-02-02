
import { Link } from 'react-router-dom';  
import { useRippleEffect } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const NavItem = ({ to, icon, label, active, onClick, hasSubmenu, children }) => {
  const handleRipple = useRippleEffect();
  
  if (hasSubmenu) {
    return (
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger 
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 cursor-pointer",
                "hover:bg-primary/10 hover:text-white", 
                active ? "bg-primary/10 text-primary" : "text-foreground/80"
              )}
            >
              <span className={cn(
                "transition-all duration-300",
                active ? "text-primary" : "text-foreground/60"
              )}>
                {icon}
              </span>
              <span className="font-medium">{label}</span>
            </NavigationMenuTrigger>
           
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link 
          to={to} 
          className={cn(
            "relative flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-300",
            "hover:bg-primary/10 hover:text-primary",
            "overflow-hidden",
            active ? "bg-primary/10 text-primary" : "text-foreground/80"
          )}
          onClick={(e) => {
            handleRipple(e);
            onClick();
          }}
        >
          <span className={cn(
            "transition-all duration-300",
            active ? "text-primary" : "text-foreground/60"
          )}>
            {icon}
          </span>
          {active && (
            <span className="ml-2 font-medium">{label}</span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};


export const Navbar = () => {

  

  return (
    <>
      <TooltipProvider>
        <header className="glass-panel fixed top-6 left-1/2 transform -translate-x-1/2 z-40 rounded-lg px-1 py-1">
          <nav className="flex items-center">
            {/* Surveys with submenu */}
            <NavItem
              to="#"
              label="Home"
              onClick={() => {}}
              hasSubmenu={true}
            > 
              
            </NavItem>
{/* 
            <NavItem
              to="#"
              label="Pricing"
              onClick={() => {}}
              hasSubmenu={true}
            >
              
            </NavItem> */}
            <NavItem
              to="#"
              label="Features"
              onClick={() => {}}
              hasSubmenu={true}
            >
              
            </NavItem>

            <NavItem
              to="#"
              label="Login"
              onClick={() => {}}
              hasSubmenu={true}
            >
              
            </NavItem>
          
          
          </nav>
        </header>
      </TooltipProvider>
    </>
  );
};

export default Navbar;
